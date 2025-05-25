// src/pages/admin/user-management/UserManagementPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { AdminUserService } from '../../../services/AdminUserService';
import { UserAdminView, UserCreationAdminPayload, RoleType, UserRoleUpdatePayload } from '../../../types/UserAdminTypes';
import { PlusCircle, Users as UsersIcon, Search, Loader2, AlertTriangle, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;
const ACCENT_COLOR = 'blue';

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<UserAdminView[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
    const [userModalMode, setUserModalMode] = useState<'add' | 'editRole'>('add');
    const [currentUser, setCurrentUser] = useState<UserAdminView | null>(null);
    const [formData, setFormData] = useState<Partial<UserCreationAdminPayload>>({
        username: '',
        email: '',
        password: '',
        role: 'USER',
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingUser, setDeletingUser] = useState<UserAdminView | null>(null);

    const roleOptions: RoleType[] = ['USER', 'TRAINER', 'ADMIN'];

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await AdminUserService.getAllUsers();
            setUsers(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
            setError(message);
            console.error("Błąd ładowania użytkowników:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

    const handleOpenUserModal = (mode: 'add' | 'editRole', user?: UserAdminView) => {
        setError(null);
        setUserModalMode(mode);
        setCurrentUser(user || null);
        if (mode === 'add') {
            setFormData({ username: '', email: '', password: '', role: 'USER' });
        } else if (user) {
            setFormData({ role: user.role });
        }
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setCurrentUser(null);
        setFormData({ username: '', email: '', password: '', role: 'USER' });
        setError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (userModalMode === 'add') {
                if (!formData.username || !formData.email || !formData.password || !formData.role) {
                    setError("Wszystkie pola są wymagane do utworzenia użytkownika.");
                    setIsLoading(false);
                    return;
                }
                const payload: UserCreationAdminPayload = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role as RoleType,
                };
                await AdminUserService.createUserByAdmin(payload);
            } else if (userModalMode === 'editRole' && currentUser && formData.role) {
                const payload: UserRoleUpdatePayload = { role: formData.role as RoleType };
                await AdminUserService.updateUserRole(currentUser.userId, payload);
            }
            await loadUsers();
            handleCloseUserModal();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił błąd zapisu.';
            setError(message);
            console.error("Błąd zapisu użytkownika:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUserClick = (user: UserAdminView) => {
        setDeletingUser(user);
        setIsDeleteModalOpen(true);
        setError(null);
    };

    const confirmDeleteUser = async () => {
        if (!deletingUser) return;
        setIsLoading(true);
        setError(null);
        try {
            await AdminUserService.deleteUser(deletingUser.userId);
            const updatedUsers = users.filter(u => u.userId !== deletingUser.userId);
            setUsers(updatedUsers);

            const newTotalPages = Math.max(1, Math.ceil(updatedUsers.length / ITEMS_PER_PAGE));
            if (currentPage > newTotalPages) {
                setCurrentPage(newTotalPages);
            } else if (filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE).length === 1 && currentPage > 1 && updatedUsers.length > 0) {
                setCurrentPage(currentPage - 1);
            } else if (updatedUsers.length === 0) {
                setCurrentPage(1);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd podczas usuwania.';
            setError(message);
            console.error("Błąd usuwania użytkownika:", err);
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
            setDeletingUser(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <UsersIcon className={`w-8 h-8 text-${ACCENT_COLOR}-600`} />
                        <h1 className="text-3xl font-bold text-slate-800">Zarządzanie Użytkownikami</h1>
                    </div>
                    <p className="text-gray-500">Dodawaj użytkowników, zarządzaj ich rolami i usuwaj konta.</p>
                </header>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj użytkowników..."
                            className={`w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenUserModal('add')}
                        className={`inline-flex items-center justify-center px-4 py-2.5 bg-${ACCENT_COLOR}-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 transition-colors`}
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Dodaj użytkownika
                    </button>
                </div>

                {error && !isUserModalOpen && !isDeleteModalOpen && (
                    <div className={`mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center`}>
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 overflow-hidden">
                    {isLoading && users.length === 0 && !error ? (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${ACCENT_COLOR}-500`} />
                            <p>Ładowanie użytkowników...</p>
                        </div>
                    ) : !isLoading && paginatedUsers.length === 0 && searchTerm && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <p className="text-lg font-medium">Brak wyników dla "{searchTerm}"</p>
                        </div>
                    ) : !isLoading && users.length === 0 && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <UsersIcon size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nie znaleziono żadnych użytkowników.</p>
                        </div>
                    ) : paginatedUsers.length > 0 && !error ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead className={`bg-gray-50 border-b border-gray-200`}>
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nazwa użytkownika</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rola</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedUsers.map((user) => (
                                    <tr key={user.userId} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.userId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${user.role === 'ADMIN' ? `bg-red-100 text-red-800` :
                                                    user.role === 'TRAINER' ? `bg-yellow-100 text-yellow-800` :
                                                        `bg-green-100 text-green-800`}`}>
                                                    {user.role}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                                            <button
                                                onClick={() => handleOpenUserModal('editRole', user)}
                                                title="Zmień rolę"
                                                className={`p-1.5 text-gray-400 hover:text-${ACCENT_COLOR}-600 rounded-md hover:bg-${ACCENT_COLOR}-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUserClick(user)}
                                                title="Usuń użytkownika"
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                    {totalPages > 0 && !error && filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-600`}
                            >
                                <ChevronLeft size={16} className="mr-1" /> Poprzednia
                            </button>
                            <span className="text-sm text-gray-600">
                                Strona {currentPage} z {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || isLoading}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-600`}
                            >
                                Następna <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    )}
                </div>

                {isUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                            <form onSubmit={handleSaveUser}>
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-xl font-semibold text-slate-700">
                                        {userModalMode === 'add' ? 'Dodaj nowego użytkownika' : `Zmień rolę dla ${currentUser?.username}`}
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    {error && (
                                        <div className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                            <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    {userModalMode === 'add' && (
                                        <>
                                            <div>
                                                <label htmlFor="username_input" className="block text-sm font-medium text-gray-700 mb-1">Nazwa użytkownika</label>
                                                <input type="text" id="username_input" name="username" value={formData.username || ''} onChange={handleFormChange} required
                                                       className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                            </div>
                                            <div>
                                                <label htmlFor="email_input" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <input type="email" id="email_input" name="email" value={formData.email || ''} onChange={handleFormChange} required
                                                       className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                            </div>
                                            <div>
                                                <label htmlFor="password_input" className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
                                                <input type="password" id="password_input" name="password" value={formData.password || ''} onChange={handleFormChange} required={userModalMode === 'add'}
                                                       className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label htmlFor="role_select" className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                                        <select id="role_select" name="role" value={formData.role || 'USER'} onChange={handleFormChange} required
                                                className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}>
                                            {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                    <button type="button" onClick={handleCloseUserModal} disabled={isLoading}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
                                        Anuluj
                                    </button>
                                    <button type="submit" disabled={isLoading}
                                            className={`px-4 py-2 text-sm font-medium text-white bg-${ACCENT_COLOR}-600 rounded-lg shadow-sm hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[80px]`}>
                                        {isLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : (userModalMode === 'add' ? 'Dodaj' : 'Zapisz rolę')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDeleteModalOpen && deletingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-5">
                                <div className="flex items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Usuń użytkownika
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Czy na pewno chcesz usunąć użytkownika <span className="font-semibold">{deletingUser.username} ({deletingUser.email})</span>? Tej operacji nie można cofnąć.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 rounded-b-xl">
                                <button type="button" onClick={confirmDeleteUser} disabled={isLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 min-w-[100px]">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Usuń'}
                                </button>
                                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeletingUser(null); setError(null);}} disabled={isLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50">
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserManagementPage;