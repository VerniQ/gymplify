// src/pages/admin/exercise/ExercisesPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { ExerciseService } from '../../../services/ExerciseService';
import { Exercise, ExercisePayload, MuscleGroupSelection } from '../../../types/ExerciseTypes';
import { MuscleGroupService } from '../../../services/MuscleGroupService';
import { MuscleGroup } from '../../../types/MuscleGroupTypes'; // Używamy teraz typu MuscleGroup

import {
    PlusCircle,
    Edit3,
    Trash2,
    Search,
    Dumbbell,
    Loader2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';

interface CustomError extends Error {
    response?: {
        data?: { message?: string; messages?: string[] };
        status?: number;
    };
}

const ExercisesPage: React.FC = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [availableMuscleGroups, setAvailableMuscleGroups] = useState<MuscleGroupSelection[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

    const initialFormData: ExercisePayload = { name: '', description: null, groupId: null };
    const [formData, setFormData] = useState<ExercisePayload>(initialFormData);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [deletingExerciseId, setDeletingExerciseId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 7;
    const ACCENT_COLOR = 'blue';

    const getErrorMessage = (err: unknown): string => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
            const customErr = err as CustomError;
            const data = customErr.response?.data;
            if (data?.message) return data.message;
            if (data?.messages && Array.isArray(data.messages)) return data.messages.join(', ');
        }
        if (err instanceof Error) return err.message;
        return 'Wystąpił nieznany błąd.';
    };

    const loadExercises = useCallback(async () => {
        setError(null);
        try {
            const data = await ExerciseService.getAllExercises();
            const validData = data.filter(ex => ex.exerciseId != null);
            setExercises(validData.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage || 'Wystąpił nieoczekiwany błąd podczas ładowania ćwiczeń.');
            console.error('Load Exercises Error:', err);
        }
    }, []);

    const loadMuscleGroupsForSelect = useCallback(async () => {
        try {
            // Zakładamy, że MuscleGroupService.getAllMuscleGroups() zwraca MuscleGroup[]
            // gdzie MuscleGroup to { id: string; name: string; description: string | null; }
            const dataFromService: MuscleGroup[] = await MuscleGroupService.getAllMuscleGroups();
            const validGroups: MuscleGroupSelection[] = dataFromService
                .filter(mg => mg.id != null)
                .map(mg => ({ id: Number(mg.id), name: mg.name })); // Konwertujemy string id na number
            setAvailableMuscleGroups(validGroups);
        } catch (err) {
            console.error("Nie udało się załadować grup mięśniowych dla formularza:", err);
            setError("Nie udało się załadować listy grup mięśniowych.");
        }
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await Promise.all([
                loadExercises(),
                loadMuscleGroupsForSelect()
            ]);
        } catch (e) {
            const errorMessage = getErrorMessage(e);
            setError(errorMessage || 'Wystąpił błąd podczas ładowania danych.');
            console.error('Fetch Data Error:', e);
        } finally {
            setIsLoading(false);
        }
    }, [loadExercises, loadMuscleGroupsForSelect]);


    useEffect(() => {
        loadData().catch(console.error);
    }, [loadData]);


    const handleOpenModal = (mode: 'add' | 'edit', exercise?: Exercise) => {
        setError(null);
        setModalMode(mode);

        if (mode === 'edit' && (exercise?.exerciseId == null)) {
            setError("Nie można edytować ćwiczenia: brak ID.");
            setIsModalOpen(false);
            return;
        }

        setCurrentExercise(exercise || null);
        if (exercise) {
            setFormData({
                name: exercise.name,
                description: exercise.description || null,
                groupId: exercise.groupId
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentExercise(null);
        setFormData(initialFormData);
        setError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: name === 'description' && value === '' ? null :
                (name === 'groupId' ? (value === '' ? null : Number(value)) : value),
        }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim()) {
            setError("Nazwa ćwiczenia jest wymagana.");
            return;
        }
        if (formData.groupId == null || formData.groupId === 0) {
            setError("Wybór grupy mięśniowej jest wymagany.");
            return;
        }
        setIsFormLoading(true);

        const payload: ExercisePayload = {
            name: formData.name.trim(),
            description: formData.description ? formData.description.trim() : null,
            groupId: formData.groupId,
        };

        try {
            if (modalMode === 'add') {
                await ExerciseService.addExercise(payload);
            } else if (currentExercise?.exerciseId != null) {
                await ExerciseService.updateExercise(currentExercise.exerciseId, payload);
            } else if (modalMode === 'edit') {
                setError("Nie można zapisać zmian: nieprawidłowe ID ćwiczenia.");
                setIsFormLoading(false);
                return;
            }
            await loadExercises();
            handleCloseModal();
        } catch (err: unknown) {
            const actionType = modalMode === 'add' ? 'dodawania' : 'aktualizacji';
            const errorMessage = getErrorMessage(err);
            setError(errorMessage || `Wystąpił nieoczekiwany błąd podczas ${actionType} ćwiczenia.`);
            console.error(`Save Exercise Error (${actionType}):`, err);
        } finally {
            setIsFormLoading(false);
        }
    };

    const handleDeleteClick = (idInput: number | undefined | null) => {
        setError(null);
        if (idInput == null) {
            setError("Nie można usunąć ćwiczenia: nieprawidłowe ID.");
            return;
        }
        setDeletingExerciseId(idInput);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (deletingExerciseId == null) {
            setError("Nie można usunąć ćwiczenia: nieprawidłowe ID.");
            setShowDeleteConfirm(false);
            setDeletingExerciseId(null);
            return;
        }
        setIsFormLoading(true);
        setError(null);
        try {
            await ExerciseService.deleteExercise(deletingExerciseId);
            await loadExercises();
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage || 'Wystąpił nieoczekiwany błąd podczas usuwania ćwiczenia.');
            console.error('Delete Exercise Error:', err);
        } finally {
            setIsFormLoading(false);
            setShowDeleteConfirm(false);
            setDeletingExerciseId(null);
        }
    };

    const filteredExercises = useMemo(() => {
        return exercises
            .filter(ex => ex.exerciseId != null)
            .filter(ex =>
                ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ex.groupName && ex.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [exercises, searchTerm]);

    const paginatedExercises = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredExercises.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredExercises, currentPage, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredExercises.length / itemsPerPage));

    const renderTableContent = () => {
        if (isLoading && exercises.length === 0 && !error) {
            return ( <div className="p-10 flex flex-col items-center justify-center text-gray-500"> <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${ACCENT_COLOR}-500`} /> <p>Ładowanie danych...</p> </div> );
        }
        if (!isLoading && paginatedExercises.length === 0 && searchTerm && !error) {
            return ( <div className="p-10 text-center text-gray-500"> <Search size={48} className="mx-auto mb-4 opacity-50" /> <p className="text-lg font-medium">Brak wyników dla "{searchTerm}"</p> <p className="text-sm">Spróbuj innego wyszukiwania lub wyczyść filtry.</p> </div> );
        }
        if (!isLoading && exercises.length === 0 && !error) {
            return ( <div className="p-10 text-center text-gray-500"> <Dumbbell size={48} className="mx-auto mb-4 opacity-50" /> <p className="text-lg font-medium">Nie znaleziono żadnych ćwiczeń.</p> <p className="text-sm">Kliknij "Dodaj nowe ćwiczenie", aby rozpocząć.</p> </div> );
        }
        if (paginatedExercises.length > 0 && !error) {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className={`bg-gray-50 border-b border-gray-200`}>
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nazwa Ćwiczenia</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Grupa Mięśniowa</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Opis (fragment)</th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedExercises.map((exercise) => (
                            <tr key={exercise.exerciseId} className="hover:bg-gray-50/70 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{exercise.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                    {exercise.groupName || (exercise.groupId != null ? `ID Grupy: ${exercise.groupId}` : <span className="italic text-gray-400">Nieprzypisane</span>)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell max-w-xs truncate" title={exercise.description || ''}>
                                    {exercise.description ? (exercise.description.length > 40 ? exercise.description.substring(0, 40) + '...' : exercise.description) : <span className="italic text-gray-400">Brak opisu</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                                    <button
                                        onClick={() => handleOpenModal('edit', exercise)}
                                        title="Edytuj"
                                        className={`p-1.5 text-gray-400 hover:text-${ACCENT_COLOR}-600 rounded-md hover:bg-${ACCENT_COLOR}-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                        disabled={exercise.exerciseId == null}
                                    >
                                        <Edit3 size={18} strokeWidth={2} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(exercise.exerciseId)}
                                        title="Usuń"
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        disabled={exercise.exerciseId == null}
                                    >
                                        <Trash2 size={18} strokeWidth={2} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <Dumbbell className={`w-8 h-8 text-${ACCENT_COLOR}-600`} />
                        <h1 className="text-3xl font-bold text-slate-800">Zarządzanie Ćwiczeniami</h1>
                    </div>
                    <p className="text-gray-500">Dodawaj, edytuj i usuwaj ćwiczenia dostępne w systemie.</p>
                </header>

                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="relative w-full md:w-auto md:flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj ćwiczeń..."
                            className={`w-50 pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="mt-2 md:mt-0 md:ml-4">
                        <button
                            onClick={() => handleOpenModal('add')}
                            className={`inline-flex items-center justify-center px-4 py-2.5 bg-${ACCENT_COLOR}-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${ACCENT_COLOR}-500 transition-colors whitespace-nowrap`}
                        >
                            <PlusCircle size={18} className="mr-2" />
                            Dodaj Ćwiczenie
                        </button>
                    </div>
                </div>


                {error && !isModalOpen && !showDeleteConfirm && (
                    <div className={`mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center`}>
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 overflow-hidden">
                    {renderTableContent()}
                    {totalPages > 0 && !error && paginatedExercises.length > 0 && (
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
                            <form onSubmit={handleSaveChanges}>
                                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-slate-700">
                                        {modalMode === 'add' ? 'Dodaj nowe ćwiczenie' : 'Edytuj ćwiczenie'}
                                    </h3>
                                    <button type="button" onClick={handleCloseModal} className={`p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100`}>
                                        <X size={24}/>
                                    </button>
                                </div>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    {error && (
                                        <div className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                            <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="exercise_name_input" className="block text-sm font-medium text-gray-700 mb-1">
                                            Nazwa ćwiczenia <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="exercise_name_input"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="exercise_group_id_select" className="block text-sm font-medium text-gray-700 mb-1">
                                            Grupa mięśniowa <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="exercise_group_id_select"
                                            name="groupId"
                                            value={formData.groupId?.toString() || ''}
                                            onChange={handleFormChange}
                                            className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                                            required
                                        >
                                            <option value="">-- Wybierz grupę --</option>
                                            {availableMuscleGroups.map(mg => (
                                                <option key={mg.id} value={mg.id.toString()}>
                                                    {mg.name}
                                                </option>
                                            ))}
                                        </select>
                                        {availableMuscleGroups.length === 0 && !isLoading && <p className="text-xs text-red-500 mt-1">Brak zdefiniowanych grup mięśniowych. Dodaj je najpierw.</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="exercise_description_input" className="block text-sm font-medium text-gray-700 mb-1">
                                            Opis (opcjonalnie)
                                        </label>
                                        <textarea
                                            id="exercise_description_input"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleFormChange}
                                            rows={4}
                                            className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                                        />
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isFormLoading}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isFormLoading || !formData.name.trim() || formData.groupId == null || formData.groupId === 0}
                                        className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-${ACCENT_COLOR}-600 rounded-lg shadow-sm hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${ACCENT_COLOR}-500 disabled:opacity-50 min-w-[90px]`}
                                    >
                                        {isFormLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            modalMode === 'add' ? 'Dodaj' : 'Zapisz'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && deletingExerciseId != null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-5">
                                <div className="flex items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Usuń ćwiczenie
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Czy na pewno chcesz usunąć ćwiczenie <span className="font-semibold">{exercises.find(ex => ex.exerciseId === deletingExerciseId)?.name || 'o nieznanym ID'}</span>? Tej operacji nie można cofnąć.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {error && (
                                <div className="px-6 pb-2">
                                    <div className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                        <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}
                            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={isFormLoading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 min-w-[100px]"
                                >
                                    {isFormLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Usuń'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {setShowDeleteConfirm(false); setDeletingExerciseId(null); setError(null);}}
                                    disabled={isFormLoading}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
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

export default ExercisesPage;