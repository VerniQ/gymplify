// src/pages/admin/training-plans/TrainingPlansPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { TrainingPlanService } from '../../../services/TrainingPlanService';
import { ExerciseService } from '../../../services/ExerciseService';
import { TrainingPlan, CreateTrainingPlanPayload, ExerciseInPlan } from '../../../types/TrainingPlanTypes';
import { Exercise } from '../../../types/ExerciseTypes';
import {
    PlusCircle,
    ClipboardList as TrainingPlanIcon,
    Search,
    Loader2,
    AlertTriangle,
    Edit3,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Settings2,
    X,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;
const ACCENT_COLOR = 'teal';

const TrainingPlansPage: React.FC = () => {
    const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
    const [planModalMode, setPlanModalMode] = useState<'add' | 'edit'>('add');
    const [currentPlan, setCurrentPlan] = useState<TrainingPlan | null>(null);
    const [planFormData, setPlanFormData] = useState<Partial<CreateTrainingPlanPayload>>({ name: '' });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingPlan, setDeletingPlan] = useState<TrainingPlan | null>(null);

    const [isExercisesModalOpen, setIsExercisesModalOpen] = useState<boolean>(false);
    const [selectedPlanForExercises, setSelectedPlanForExercises] = useState<TrainingPlan | null>(null);
    const [exercisesInSelectedPlan, setExercisesInSelectedPlan] = useState<ExerciseInPlan[]>([]);
    const [allAvailableExercises, setAllAvailableExercises] = useState<Exercise[]>([]);
    const [exerciseToAdd, setExerciseToAdd] = useState<string>('');
    const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(false);

    useEffect(() => {
        loadTrainingPlans();
    }, []);

    useEffect(() => {
        if (isExercisesModalOpen) {
            loadAllAvailableExercises();
        }
    }, [isExercisesModalOpen]);

    const loadTrainingPlans = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await TrainingPlanService.getAllTrainingPlans();
            setTrainingPlans(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAllAvailableExercises = async () => {
        setIsLoadingExercises(true);
        try {
            const exercisesData = await ExerciseService.getAllExercises();
            setAllAvailableExercises(exercisesData);
        } catch (err) {
            console.error("Błąd ładowania wszystkich dostępnych ćwiczeń:", err);
        } finally {
            setIsLoadingExercises(false);
        }
    };

    const filteredTrainingPlans = useMemo(() => {
        return trainingPlans.filter(plan =>
            plan.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [trainingPlans, searchTerm]);

    const paginatedTrainingPlans = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTrainingPlans.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTrainingPlans, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredTrainingPlans.length / ITEMS_PER_PAGE));

    const handleOpenPlanModal = (mode: 'add' | 'edit', plan?: TrainingPlan) => {
        setError(null);
        setPlanModalMode(mode);
        setCurrentPlan(plan || null);
        setPlanFormData(mode === 'edit' && plan ? { name: plan.name } : { name: '' });
        setIsPlanModalOpen(true);
    };

    const handleClosePlanModal = () => {
        setIsPlanModalOpen(false);
        setCurrentPlan(null);
        setPlanFormData({ name: '' });
        setError(null);
    };

    const handlePlanFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlanFormData({ name: e.target.value });
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!planFormData.name?.trim()) {
            setError("Nazwa planu nie może być pusta.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            if (planModalMode === 'add') {
                await TrainingPlanService.createTrainingPlan({ name: planFormData.name.trim() });
            } else if (planModalMode === 'edit' && currentPlan) {
                await TrainingPlanService.updateTrainingPlan(currentPlan.planId, { name: planFormData.name.trim() });
            }
            await loadTrainingPlans();
            handleClosePlanModal();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił błąd zapisu.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePlanClick = (plan: TrainingPlan) => {
        setDeletingPlan(plan);
        setIsDeleteModalOpen(true);
        setError(null);
    };

    const confirmDeletePlan = async () => {
        if (!deletingPlan) return;
        setIsLoading(true);
        setError(null);
        try {
            await TrainingPlanService.deleteTrainingPlan(deletingPlan.planId);
            await loadTrainingPlans();
            const newTotalItems = trainingPlans.length - 1;
            const newTotalPages = Math.max(1, Math.ceil(newTotalItems / ITEMS_PER_PAGE));
            if (currentPage > newTotalPages) {
                setCurrentPage(newTotalPages);
            } else if (paginatedTrainingPlans.length === 1 && currentPage > 1 && newTotalItems > 0) {
                setCurrentPage(currentPage - 1);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd podczas usuwania.';
            setError(message);
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
            setDeletingPlan(null);
        }
    };

    const handleOpenExercisesModal = async (plan: TrainingPlan) => {
        setSelectedPlanForExercises(plan);
        setIsExercisesModalOpen(true);
        setError(null);
        setIsLoadingExercises(true);
        try {
            const exercises = await TrainingPlanService.getExercisesForPlan(plan.planId);
            setExercisesInSelectedPlan(exercises);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd ładowania ćwiczeń dla planu.';
            setError(message);
            setExercisesInSelectedPlan([]);
        } finally {
            setIsLoadingExercises(false);
        }
    };

    const handleCloseExercisesModal = () => {
        setIsExercisesModalOpen(false);
        setSelectedPlanForExercises(null);
        setExercisesInSelectedPlan([]);
        setExerciseToAdd('');
        setError(null);
    };

    const handleAddExerciseToSelectedPlan = async () => {
        if (!selectedPlanForExercises || !exerciseToAdd) return;
        setIsLoadingExercises(true);
        try {
            await TrainingPlanService.addExerciseToPlan(selectedPlanForExercises.planId, Number(exerciseToAdd));
            const updatedExercises = await TrainingPlanService.getExercisesForPlan(selectedPlanForExercises.planId);
            setExercisesInSelectedPlan(updatedExercises);
            setExerciseToAdd('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd dodawania ćwiczenia.';
            setError(message);
        } finally {
            setIsLoadingExercises(false);
        }
    };

    const handleRemoveExerciseFromSelectedPlan = async (exerciseId: number) => {
        if (!selectedPlanForExercises) return;
        setIsLoadingExercises(true);
        try {
            await TrainingPlanService.removeExerciseFromPlan(selectedPlanForExercises.planId, exerciseId);
            const updatedExercises = await TrainingPlanService.getExercisesForPlan(selectedPlanForExercises.planId);
            setExercisesInSelectedPlan(updatedExercises);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd usuwania ćwiczenia.';
            setError(message);
        } finally {
            setIsLoadingExercises(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent/>
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <TrainingPlanIcon className={`w-8 h-8 text-${ACCENT_COLOR}-600`}/>
                        <h1 className="text-3xl font-bold text-slate-800">Szablony Planów Treningowych</h1>
                    </div>
                    <p className="text-gray-500">Zarządzaj szablonami planów treningowych i przypisanymi do nich
                        ćwiczeniami.</p>
                </header>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input
                            type="text"
                            placeholder="Szukaj planów..."
                            className={`w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenPlanModal('add')}
                        className={`inline-flex items-center justify-center px-4 py-2.5 bg-${ACCENT_COLOR}-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 transition-colors`}
                    >
                        <PlusCircle size={18} className="mr-2"/>
                        Dodaj szablon planu
                    </button>
                </div>

                {error && !isPlanModalOpen && !isDeleteModalOpen && !isExercisesModalOpen && (
                    <div
                        className={`mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center`}>
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0"/>
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 overflow-hidden">
                    {isLoading && trainingPlans.length === 0 && !error ? (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${ACCENT_COLOR}-500`}/>
                            <p>Ładowanie szablonów planów...</p>
                        </div>
                    ) : !isLoading && paginatedTrainingPlans.length === 0 && searchTerm && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <p className="text-lg font-medium">Brak wyników dla "{searchTerm}"</p>
                        </div>
                    ) : !isLoading && trainingPlans.length === 0 && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <TrainingPlanIcon size={48} className="mx-auto mb-4 opacity-50"/>
                            <p className="text-lg font-medium">Nie znaleziono żadnych szablonów planów.</p>
                        </div>
                    ) : paginatedTrainingPlans.length > 0 && !error ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className={`bg-gray-50 border-b border-gray-200`}>
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID
                                        Planu
                                    </th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nazwa
                                        Planu
                                    </th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedTrainingPlans.map((plan) => (
                                    <tr key={plan.planId} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.planId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{plan.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                                            <button
                                                onClick={() => handleOpenExercisesModal(plan)}
                                                title="Zarządzaj ćwiczeniami"
                                                className={`p-1.5 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                            >
                                                <Settings2 size={18}/>
                                            </button>
                                            <button
                                                onClick={() => handleOpenPlanModal('edit', plan)}
                                                title="Edytuj nazwę planu"
                                                className={`p-1.5 text-gray-400 hover:text-${ACCENT_COLOR}-600 rounded-md hover:bg-${ACCENT_COLOR}-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                            >
                                                <Edit3 size={18}/>
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlanClick(plan)}
                                                title="Usuń plan"
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                    {totalPages > 0 && !error && filteredTrainingPlans.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-600`}
                            >
                                <ChevronLeft size={16} className="mr-1"/> Poprzednia
                            </button>
                            <span className="text-sm text-gray-600">
                                Strona {currentPage} z {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || isLoading}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-600`}
                            >
                                Następna <ChevronRight size={16} className="ml-1"/>
                            </button>
                        </div>
                    )}
                </div>

                {isPlanModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                            <form onSubmit={handleSavePlan}>
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-xl font-semibold text-slate-700">
                                        {planModalMode === 'add' ? 'Dodaj nowy szablon planu' : 'Edytuj nazwę szablonu planu'}
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {error && (
                                        <div
                                            className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                            <AlertTriangle size={18} className="mr-2 flex-shrink-0"/>
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="planName_input"
                                               className="block text-sm font-medium text-gray-700 mb-1">Nazwa
                                            planu</label>
                                        <input type="text" id="planName_input" name="name"
                                               value={planFormData.name || ''} onChange={handlePlanFormChange} required
                                               className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}/>
                                    </div>
                                </div>
                                <div
                                    className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                    <button type="button" onClick={handleClosePlanModal} disabled={isLoading}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
                                        Anuluj
                                    </button>
                                    <button type="submit" disabled={isLoading || !planFormData.name?.trim()}
                                            className={`px-4 py-2 text-sm font-medium text-white bg-${ACCENT_COLOR}-600 rounded-lg shadow-sm hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[80px]`}>
                                        {isLoading ? <Loader2 className={`w-5 h-5 animate-spin`}/> : 'Zapisz'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDeleteModalOpen && deletingPlan && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-5">
                                <div className="flex items-start">
                                    <div
                                        className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true"/>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Usuń szablon planu
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Czy na pewno chcesz usunąć szablon planu <span
                                                className="font-semibold">"{deletingPlan.name}"</span>? Tej operacji nie
                                                można cofnąć.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {error && (
                                <div className="px-6 pb-2">
                                    <div
                                        className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                        <AlertTriangle size={18} className="mr-2 flex-shrink-0"/>
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}
                            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 rounded-b-xl">
                                <button type="button" onClick={confirmDeletePlan} disabled={isLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 min-w-[100px]">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Usuń'}
                                </button>
                                <button type="button" onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setDeletingPlan(null);
                                    setError(null);
                                }} disabled={isLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50">
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isExercisesModalOpen && selectedPlanForExercises && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
                        <div
                            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-slate-700">
                                    Zarządzaj ćwiczeniami w: <span
                                    className={`font-bold text-${ACCENT_COLOR}-600`}>{selectedPlanForExercises.name}</span>
                                </h3>
                                <button onClick={handleCloseExercisesModal}
                                        className={`text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100`}>
                                    <X size={24}/>
                                </button>
                            </div>

                            {error && (
                                <div className="m-4">
                                    <div className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                        <AlertTriangle size={18} className="mr-2 flex-shrink-0"/>
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}
                            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                                <div>
                                    <h4 className="text-md font-semibold text-gray-700 mb-3">Dodaj ćwiczenie do
                                        planu</h4>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={exerciseToAdd}
                                            onChange={(e) => setExerciseToAdd(e.target.value)}
                                            disabled={isLoadingExercises || allAvailableExercises.length === 0}
                                            className={`flex-grow px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500 disabled:bg-gray-100`}
                                        >
                                            <option value="">Wybierz ćwiczenie...</option>
                                            {allAvailableExercises.map(ex => (
                                                <option key={ex.exerciseId} value={String(ex.exerciseId)}>
                                                    {ex.name} ({ex.groupName || 'Brak grupy'})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAddExerciseToSelectedPlan}
                                            disabled={isLoadingExercises || !exerciseToAdd}
                                            className={`px-4 py-2.5 text-sm font-medium text-white bg-${ACCENT_COLOR}-600 rounded-lg shadow-sm hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[100px]`}
                                        >
                                            {isLoadingExercises && exerciseToAdd ?
                                                <Loader2 className="w-5 h-5 animate-spin"/> : 'Dodaj'}
                                        </button>
                                    </div>
                                    {isLoadingExercises && allAvailableExercises.length === 0 &&
                                        <p className="text-xs text-gray-500 mt-1">Ładowanie dostępnych ćwiczeń...</p>}
                                </div>

                                <div>
                                    <h4 className="text-md font-semibold text-gray-700 mb-2">Ćwiczenia w tym planie
                                        ({exercisesInSelectedPlan.length})</h4>
                                    {isLoadingExercises && exercisesInSelectedPlan.length === 0 && !error &&
                                        <Loader2 className={`w-6 h-6 animate-spin text-${ACCENT_COLOR}-500`}/>}
                                    {!isLoadingExercises && exercisesInSelectedPlan.length === 0 && !error && (
                                        <p className="text-sm text-gray-500 italic">Ten plan nie zawiera jeszcze żadnych
                                            ćwiczeń.</p>
                                    )}
                                    {!isLoadingExercises && error && exercisesInSelectedPlan.length === 0 && (
                                        <p className="text-sm text-red-500 italic">Nie udało się załadować ćwiczeń dla tego planu.</p>
                                    )}
                                    {exercisesInSelectedPlan.length > 0 && (
                                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50/50">
                                            {exercisesInSelectedPlan.map(exInPlan => (
                                                <li key={exInPlan.exerciseId}
                                                    className="flex justify-between items-center p-2.5 bg-white rounded-md shadow-sm border border-gray-200">
                                                    <div>
                                                        <span
                                                            className="text-sm font-medium text-gray-800">{exInPlan.name}</span>
                                                        <span
                                                            className="text-xs text-gray-500 ml-2">({exInPlan.groupName || 'Brak grupy'})</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveExerciseFromSelectedPlan(exInPlan.exerciseId)}
                                                        disabled={isLoadingExercises}
                                                        title="Usuń ćwiczenie z planu"
                                                        className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 disabled:opacity-50"
                                                    >
                                                        {isLoadingExercises ?
                                                            <Loader2 className="w-4 h-4 animate-spin"/> :
                                                            <Trash2 size={16}/>}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div
                                className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
                                <button type="button" onClick={handleCloseExercisesModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400">
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TrainingPlansPage;