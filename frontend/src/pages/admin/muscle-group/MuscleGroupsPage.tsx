// src/pages/admin/muscle-group/MuscleGroupsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { MuscleGroupService } from '../../../services/MuscleGroupService';
import { MuscleGroup, MuscleGroupPayload } from '../../../types/MuscleGroupTypes';
import {
    PlusCircle,
    Edit3,
    Trash2,
    Search,
    ListChecks,
    Loader2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const MuscleGroupsPage: React.FC = () => {
    const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentMuscleGroup, setCurrentMuscleGroup] = useState<MuscleGroup | null>(null);
    const [formData, setFormData] = useState<MuscleGroupPayload>({ groupName: '', description: null });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 7;

    const accentColor = 'blue';

    useEffect(() => {
        loadMuscleGroups();
    }, []);

    const loadMuscleGroups = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await MuscleGroupService.getAllMuscleGroups();
            // Filtruj grupy, które mogą mieć niepoprawne ID po stronie klienta, zanim ustawisz stan
            const validData = data.filter(group => group.id && group.id !== "undefined" && group.id !== "null");
            if (data.length !== validData.length) {
                console.warn("Niektóre grupy mięśniowe zostały odfiltrowane z powodu nieprawidłowego ID.", { allData: data, validData });
            }
            setMuscleGroups(validData);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Wystąpił nieoczekiwany błąd podczas ładowania danych.');
                console.error('Load Muscle Groups Error:', err.message);
            } else {
                setError('Wystąpił nieznany błąd podczas ładowania danych.');
                console.error('An unknown error occurred during load:', err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (mode: 'add' | 'edit', group?: MuscleGroup) => {
        setError(null);
        setModalMode(mode);

        if (mode === 'edit' && (!group || !group.id || group.id === "undefined" || group.id === "null")) {
            console.error("Próba edycji grupy z nieprawidłowym ID:", group);
            setError("Nie można edytować grupy: brak lub nieprawidłowe ID.");
            setIsModalOpen(false); // Nie otwieraj modala
            return;
        }

        setCurrentMuscleGroup(group || null);
        if (group) {
            setFormData({ groupName: group.name, description: group.description || null });
        } else {
            setFormData({ groupName: '', description: null });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMuscleGroup(null);
        setFormData({ groupName: '', description: null });
        setError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: name === 'description' && value === '' ? null : value,
        }));
    };

    const handleSaveMuscleGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.groupName.trim()) {
            setError("Nazwa grupy nie może być pusta.");
            return;
        }

        setIsLoading(true);

        const payload: MuscleGroupPayload = {
            groupName: formData.groupName.trim(),
            description: formData.description ? formData.description.trim() : null
        };

        try {
            if (modalMode === 'add') {
                await MuscleGroupService.addMuscleGroup(payload);
            } else if (currentMuscleGroup && currentMuscleGroup.id && currentMuscleGroup.id !== "undefined" && currentMuscleGroup.id !== "null") {
                await MuscleGroupService.updateMuscleGroup(currentMuscleGroup.id, payload);
            } else if (modalMode === 'edit') {
                console.error("Błąd zapisu edycji: Nieprawidłowe lub brakujące ID w currentMuscleGroup", currentMuscleGroup);
                setError("Nie można zapisać zmian: nieprawidłowe ID grupy.");
                setIsLoading(false);
                return;
            }
            await loadMuscleGroups();
            handleCloseModal();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || `Wystąpił nieoczekiwany błąd podczas ${modalMode === 'add' ? 'dodawania' : 'aktualizacji'} grupy.`);
                console.error('Save Muscle Group Error:', err.message, err);
            } else {
                setError(`Wystąpił nieznany błąd podczas ${modalMode === 'add' ? 'dodawania' : 'aktualizacji'} grupy.`);
                console.error('An unknown error occurred during save:', err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (id: string | null | undefined) => {
        setError(null);
        if (!id || id === "undefined" || id === "null") {
            console.error("Próba usunięcia grupy z nieprawidłowym ID:", id);
            setError("Nie można usunąć grupy: nieprawidłowe ID.");
            return;
        }
        setDeletingGroupId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deletingGroupId || deletingGroupId === "undefined" || deletingGroupId === "null") {
            console.error("Błąd potwierdzenia usunięcia: Nieprawidłowe lub brakujące ID grupy", deletingGroupId);
            setError("Nie można usunąć grupy: nieprawidłowe ID.");
            setIsLoading(false);
            setShowDeleteConfirm(false);
            setDeletingGroupId(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await MuscleGroupService.deleteMuscleGroup(deletingGroupId);
            await loadMuscleGroups();
            // Poprawiona logika paginacji
            const newMuscleGroupsCount = muscleGroups.length - 1;
            const newTotalPages = Math.max(1, Math.ceil(newMuscleGroupsCount / itemsPerPage));

            if (currentPage > newTotalPages) {
                setCurrentPage(newTotalPages);
            } else if (paginatedMuscleGroups.length === 1 && currentPage > 1 && newMuscleGroupsCount > 0) {
                setCurrentPage(currentPage - 1);
            } else if (newMuscleGroupsCount === 0) {
                setCurrentPage(1);
            }

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Wystąpił nieoczekiwany błąd podczas usuwania grupy.');
                console.error('Delete Muscle Group Error:', err.message, err);
            } else {
                setError('Wystąpił nieznany błąd podczas usuwania grupy.');
                console.error('An unknown error occurred during delete:', err);
            }
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
            setDeletingGroupId(null);
        }
    };

    const filteredMuscleGroups = useMemo(() => {
        return muscleGroups
            .filter(group => group.id && group.id !== "undefined" && group.id !== "null")
            .filter(group =>
                group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [muscleGroups, searchTerm]);

    const paginatedMuscleGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMuscleGroups.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMuscleGroups, currentPage, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredMuscleGroups.length / itemsPerPage));

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <ListChecks className={`w-8 h-8 text-${accentColor}-600`} />
                        <h1 className="text-3xl font-bold text-slate-800">Zarządzanie Grupami Mięśniowymi</h1>
                    </div>
                    <p className="text-gray-500">Dodawaj, edytuj i usuwaj grupy mięśniowe używane w systemie.</p>
                </header>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj grup..."
                            className={`w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                            value={searchTerm}
                            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal('add')}
                        className={`inline-flex items-center justify-center px-4 py-2.5 bg-${accentColor}-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-${accentColor}-700 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:ring-offset-2 transition-colors`}
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Dodaj nową grupę
                    </button>
                </div>

                {error && !isModalOpen && !showDeleteConfirm && (
                    <div className={`mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center`}>
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 overflow-hidden">
                    {isLoading && muscleGroups.length === 0 && !error ? (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${accentColor}-500`} />
                            <p>Ładowanie danych...</p>
                        </div>
                    ) : !isLoading && paginatedMuscleGroups.length === 0 && searchTerm && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <p className="text-lg font-medium">Brak wyników dla "{searchTerm}"</p>
                            <p className="text-sm">Spróbuj innego wyszukiwania.</p>
                        </div>
                    ) : !isLoading && muscleGroups.length === 0 && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <ListChecks size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nie znaleziono żadnych grup mięśniowych.</p>
                            <p className="text-sm">Kliknij "Dodaj nową grupę", aby rozpocząć.</p>
                        </div>
                    ) : paginatedMuscleGroups.length > 0 && !error ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className={`bg-gray-50 border-b border-gray-200`}>
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nazwa Grupy</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Opis (fragment)</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedMuscleGroups.map((group) => (
                                    <tr key={group.id || `fallback-key-${Math.random()}`} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{group.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell max-w-xs truncate" title={group.description || ''}>
                                            {group.description ? (group.description.length > 50 ? group.description.substring(0, 50) + '...' : group.description) : <span className="italic text-gray-400">Brak opisu</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                                            <button
                                                onClick={() => handleOpenModal('edit', group)}
                                                title="Edytuj"
                                                className={`p-1.5 text-gray-400 hover:text-${accentColor}-600 rounded-md hover:bg-${accentColor}-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                                disabled={!group.id || group.id === "undefined" || group.id === "null"}
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(group.id)}
                                                title="Usuń"
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                disabled={!group.id || group.id === "undefined" || group.id === "null"}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null }
                    {totalPages > 0 && !error && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage((prevPage: number) => Math.max(1, prevPage - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-600`}
                            >
                                <ChevronLeft size={16} className="mr-1" /> Poprzednia
                            </button>
                            <span className="text-sm text-gray-600">
                                Strona {currentPage} z {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prevPage: number) => Math.min(totalPages, prevPage + 1))}
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
                            <form onSubmit={handleSaveMuscleGroup}>
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-xl font-semibold text-slate-700">
                                        {modalMode === 'add' ? 'Dodaj nową grupę mięśniową' : 'Edytuj grupę mięśniową'}
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    {error && (
                                        <div className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                            <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="groupName_input" className="block text-sm font-medium text-gray-700 mb-1">
                                            Nazwa grupy
                                        </label>
                                        <input
                                            type="text"
                                            id="groupName_input"
                                            name="groupName"
                                            value={formData.groupName}
                                            onChange={handleFormChange}
                                            className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="description_input" className="block text-sm font-medium text-gray-700 mb-1">
                                            Opis (opcjonalnie)
                                        </label>
                                        <textarea
                                            id="description_input"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleFormChange}
                                            rows={4}
                                            className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                                        />
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isLoading}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !formData.groupName.trim()}
                                        className={`px-4 py-2 text-sm font-medium text-white bg-${accentColor}-600 rounded-lg shadow-sm hover:bg-${accentColor}-700 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[80px]`}
                                    >
                                        {isLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : (modalMode === 'add' ? 'Dodaj' : 'Zapisz')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && deletingGroupId && ( // Dodano deletingGroupId, aby modal się nie renderował bez ID
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-5">
                                <div className="flex items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Usuń grupę mięśniową
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Czy na pewno chcesz usunąć grupę mięśniową <span className="font-semibold">{muscleGroups.find(mg => mg.id === deletingGroupId)?.name || 'o nieznanym ID'}</span>? Tej operacji nie można cofnąć.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 min-w-[100px]"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Usuń'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {setShowDeleteConfirm(false); setDeletingGroupId(null); setError(null);}}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
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

export default MuscleGroupsPage;