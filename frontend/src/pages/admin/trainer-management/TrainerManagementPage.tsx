// src/pages/admin/trainer-management/TrainerManagementPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { AdminTrainerService } from '../../../services/AdminTrainerService';
import { AdminUserService } from '../../../services/AdminUserService';
import { UserAdminView} from '../../../types/UserAdminTypes';
import { TrainerAdminView, TrainerProfileUpdatePayload, TrainerProfileCreationPayload } from '../../../types/TrainerAdminTypes';
import { UserCog, Search, Loader2, AlertTriangle, Edit3, Trash2, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 10;
const ACCENT_COLOR = 'blue';

const TrainerManagementPage: React.FC = () => {
    const [trainers, setTrainers] = useState<TrainerAdminView[]>([]);
    const [usersWithoutTrainerProfile, setUsersWithoutTrainerProfile] = useState<UserAdminView[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentTrainer, setCurrentTrainer] = useState<TrainerAdminView | null>(null);
    const [formData, setFormData] = useState<Partial<TrainerProfileUpdatePayload & TrainerProfileCreationPayload>>({});

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingTrainer, setDeletingTrainer] = useState<TrainerAdminView | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [trainerProfiles, allUsers] = await Promise.all([
                AdminTrainerService.getAllTrainerProfiles(),
                AdminUserService.getAllUsers()
            ]);
            setTrainers(trainerProfiles);

            const trainerUserIds = new Set(trainerProfiles.map(tp => tp.userId));
            const usersNotTrainersYet = allUsers.filter(
                user => user.role === 'TRAINER' && !trainerUserIds.has(user.userId)
            );
            setUsersWithoutTrainerProfile(usersNotTrainersYet);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };


    const filteredTrainers = useMemo(() => {
        return trainers.filter(trainer =>
            trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trainer.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trainer.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [trainers, searchTerm]);

    const paginatedTrainers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTrainers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTrainers, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredTrainers.length / ITEMS_PER_PAGE));

    const handleOpenModal = (mode: 'add' | 'edit', trainerOrUser?: TrainerAdminView | UserAdminView) => {
        setError(null);
        setModalMode(mode);
        if (mode === 'add') {
            setCurrentTrainer(null);
            setFormData({ userId: undefined, name: '', surname: '', specialization: '', contact: '' });
        } else if (trainerOrUser && 'trainerId' in trainerOrUser) { // Edycja istniejącego trenera
            const trainer = trainerOrUser as TrainerAdminView;
            setCurrentTrainer(trainer);
            setFormData({
                name: trainer.name,
                surname: trainer.surname,
                specialization: trainer.specialization,
                contact: trainer.contact,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTrainer(null);
        setFormData({});
        setError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'userId' ? Number(value) : value }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.surname || !formData.specialization || !formData.contact || (modalMode ==='add' && !formData.userId)) {
            setError("Wszystkie pola są wymagane.");
            return;
        }
        setError(null);
        setIsLoading(true);
        try {
            if (modalMode === 'add' && formData.userId) {
                const payload: TrainerProfileCreationPayload = {
                    userId: formData.userId,
                    name: formData.name!,
                    surname: formData.surname!,
                    specialization: formData.specialization!,
                    contact: formData.contact!,
                };
                await AdminTrainerService.createTrainerProfile(payload);
            } else if (modalMode === 'edit' && currentTrainer) {
                const payload: TrainerProfileUpdatePayload = {
                    name: formData.name!,
                    surname: formData.surname!,
                    specialization: formData.specialization!,
                    contact: formData.contact!,
                };
                await AdminTrainerService.updateTrainerProfile(currentTrainer.trainerId, payload);
            }
            await loadData();
            handleCloseModal();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił błąd zapisu.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTrainerClick = (trainer: TrainerAdminView) => {
        setDeletingTrainer(trainer);
        setIsDeleteModalOpen(true);
        setError(null);
    };

    const confirmDeleteTrainer = async () => {
        if (!deletingTrainer) return;
        setIsLoading(true);
        setError(null);
        try {
            await AdminTrainerService.deleteTrainerProfile(deletingTrainer.trainerId);
            await loadData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd podczas usuwania.';
            setError(message);
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
            setDeletingTrainer(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <UserCog className={`w-8 h-8 text-${ACCENT_COLOR}-600`} />
                        <h1 className="text-3xl font-bold text-slate-800">Zarządzanie Profilami Trenerów</h1>
                    </div>
                    <p className="text-gray-500">Dodawaj, edytuj i usuwaj profile aktywnych trenerów.</p>
                </header>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj trenerów..."
                            className={`w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal('add')}
                        disabled={usersWithoutTrainerProfile.length === 0}
                        className={`inline-flex items-center justify-center px-4 py-2.5 bg-${ACCENT_COLOR}-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Dodaj Profil Trenera
                    </button>
                </div>

                {error && !isModalOpen && !isDeleteModalOpen && (
                    <div className={`mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center`}>
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 overflow-hidden">
                    {isLoading && trainers.length === 0 && !error ? (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${ACCENT_COLOR}-500`} />
                            <p>Ładowanie profili trenerów...</p>
                        </div>
                    ) : !isLoading && paginatedTrainers.length === 0 && searchTerm && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <p className="text-lg font-medium">Brak wyników dla "{searchTerm}"</p>
                        </div>
                    ) : !isLoading && trainers.length === 0 && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <UserCog size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nie znaleziono żadnych profili trenerów.</p>
                            {usersWithoutTrainerProfile.length > 0 && <p className="text-sm">Możesz dodać profil dla istniejącego użytkownika z rolą TRENER.</p>}
                        </div>
                    ) : paginatedTrainers.length > 0 && !error ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead className={`bg-gray-50 border-b border-gray-200`}>
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Trenera</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Imię</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nazwisko</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Specjalizacja</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontakt</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email (User)</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedTrainers.map((trainer) => (
                                    <tr key={trainer.trainerId} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer.trainerId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{trainer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{trainer.surname}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer.specialization}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer.contact}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={trainer.username}>{trainer.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                                            <button
                                                onClick={() => handleOpenModal('edit', trainer)}
                                                title="Edytuj profil trenera"
                                                className={`p-1.5 text-gray-400 hover:text-${ACCENT_COLOR}-600 rounded-md hover:bg-${ACCENT_COLOR}-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTrainerClick(trainer)}
                                                title="Usuń profil trenera"
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
                    {totalPages > 0 && !error && filteredTrainers.length > 0 && (
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

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                            <form onSubmit={handleSaveChanges}>
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-xl font-semibold text-slate-700">
                                        {modalMode === 'add' ? 'Dodaj nowy profil trenera' : `Edytuj profil: ${currentTrainer?.name} ${currentTrainer?.surname}`}
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    {error && (
                                        <div className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                            <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    {modalMode === 'add' && (
                                        <div>
                                            <label htmlFor="userId_select" className="block text-sm font-medium text-gray-700 mb-1">Wybierz użytkownika (z rolą TRENER)</label>
                                            <select id="userId_select" name="userId" value={formData.userId || ''} onChange={handleFormChange} required
                                                    className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}>
                                                <option value="" disabled>Wybierz użytkownika...</option>
                                                {usersWithoutTrainerProfile.map(user => (
                                                    <option key={user.userId} value={user.userId}>{user.username} ({user.email})</option>
                                                ))}
                                            </select>
                                            {usersWithoutTrainerProfile.length === 0 && <p className="text-xs text-red-500 mt-1">Brak dostępnych użytkowników z rolą TRENER bez profilu.</p>}
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="name_input_trainer" className="block text-sm font-medium text-gray-700 mb-1">Imię</label>
                                        <input type="text" id="name_input_trainer" name="name" value={formData.name || ''} onChange={handleFormChange} required
                                               className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                    </div>
                                    <div>
                                        <label htmlFor="surname_input_trainer" className="block text-sm font-medium text-gray-700 mb-1">Nazwisko</label>
                                        <input type="text" id="surname_input_trainer" name="surname" value={formData.surname || ''} onChange={handleFormChange} required
                                               className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                    </div>
                                    <div>
                                        <label htmlFor="specialization_input_trainer" className="block text-sm font-medium text-gray-700 mb-1">Specjalizacja</label>
                                        <input type="text" id="specialization_input_trainer" name="specialization" value={formData.specialization || ''} onChange={handleFormChange} required
                                               className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                    </div>
                                    <div>
                                        <label htmlFor="contact_input_trainer" className="block text-sm font-medium text-gray-700 mb-1">Kontakt (np. telefon)</label>
                                        <input type="text" id="contact_input_trainer" name="contact" value={formData.contact || ''} onChange={handleFormChange} required
                                               className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                    <button type="button" onClick={handleCloseModal} disabled={isLoading}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
                                        Anuluj
                                    </button>
                                    <button type="submit" disabled={isLoading || (modalMode === 'add' && (usersWithoutTrainerProfile.length === 0 || !formData.userId))}
                                            className={`px-4 py-2 text-sm font-medium text-white bg-${ACCENT_COLOR}-600 rounded-lg shadow-sm hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[80px]`}>
                                        {isLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : (modalMode === 'add' ? 'Dodaj Profil' : 'Zapisz zmiany')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDeleteModalOpen && deletingTrainer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-5">
                                <div className="flex items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Usuń profil trenera
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Czy na pewno chcesz usunąć profil trenera <span className="font-semibold">{deletingTrainer.name} {deletingTrainer.surname}</span>?
                                                Konto użytkownika ({deletingTrainer.email}) pozostanie, ale profil trenerski i powiązane sesje/plany zostaną usunięte. Tej operacji nie można cofnąć.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 rounded-b-xl">
                                <button type="button" onClick={confirmDeleteTrainer} disabled={isLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 min-w-[100px]">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Usuń profil'}
                                </button>
                                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeletingTrainer(null); setError(null);}} disabled={isLoading}
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

export default TrainerManagementPage;