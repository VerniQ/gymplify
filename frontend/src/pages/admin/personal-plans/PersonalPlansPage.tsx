// src/pages/admin/personal-plan-management/PersonalPlanManagementPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { PersonalPlanService } from '../../../services/PersonalPlanService';
import {
    PersonalPlanDto,
    PersonalPlanCreationPayload,
    PersonalPlanUpdatePayload,
    UserSelectionDto,
    TrainerSelectionDto,
    TrainingPlanSelectionDto
} from '../../../types/PersonalPlanTypes';

import { AdminUserService } from '../../../services/AdminUserService';
import { AdminTrainerService } from '../../../services/AdminTrainerService';
import { TrainingPlanService } from '../../../services/TrainingPlanService';

import { ClipboardList, Search, Loader2, AlertTriangle, Edit3, Trash2, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 10;
const ACCENT_COLOR = 'indigo';

const PersonalPlanManagementPage: React.FC = () => {
    const [personalPlans, setPersonalPlans] = useState<PersonalPlanDto[]>([]);
    const [users, setUsers] = useState<UserSelectionDto[]>([]);
    const [trainers, setTrainers] = useState<TrainerSelectionDto[]>([]);
    const [trainingPlans, setTrainingPlans] = useState<TrainingPlanSelectionDto[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentPlanAssignment, setCurrentPlanAssignment] = useState<PersonalPlanDto | null>(null);
    const [formData, setFormData] = useState<Partial<PersonalPlanCreationPayload & PersonalPlanUpdatePayload>>({});

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingPlanAssignment, setDeletingPlanAssignment] = useState<PersonalPlanDto | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [plansData, usersData, trainersData, trainingPlansData] = await Promise.all([
                PersonalPlanService.listAllPersonalPlans(),
                AdminUserService.getAllUsers(),
                AdminTrainerService.getAllTrainerProfiles(),
                TrainingPlanService.getAllTrainingPlans()
            ]);
            setPersonalPlans(plansData);
            setUsers(usersData.map(u => ({ userId: u.userId, username: u.username, email: u.email })));
            setTrainers(trainersData.map(t => ({ trainerId: t.trainerId, name: t.name, surname: t.surname })));
            setTrainingPlans(trainingPlansData.map(tp => ({ planId: tp.planId, name: tp.name })));

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas ładowania danych.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPlans = useMemo(() => {
        return personalPlans.filter(pp =>
            pp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pp.trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pp.trainerSurname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pp.planName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [personalPlans, searchTerm]);

    const paginatedPlans = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPlans.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredPlans, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredPlans.length / ITEMS_PER_PAGE));

    const handleOpenModal = (mode: 'add' | 'edit', planAssignment?: PersonalPlanDto) => {
        setError(null);
        setModalMode(mode);
        if (mode === 'add') {
            setCurrentPlanAssignment(null);
            setFormData({ userId: undefined, trainerId: undefined, planId: undefined });
        } else if (planAssignment) {
            setCurrentPlanAssignment(planAssignment);
            setFormData({
                newTrainerId: planAssignment.trainerId,
                newPlanId: planAssignment.planId,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentPlanAssignment(null);
        setFormData({});
        setError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (modalMode === 'add') {
            if (!formData.userId || !formData.trainerId || !formData.planId) {
                setError("Wszystkie pola (Użytkownik, Trener, Plan) są wymagane do dodania przypisania.");
                return;
            }
        } else if (modalMode === 'edit') {
            if (!formData.newTrainerId || !formData.newPlanId) {
                setError("Pola Nowy Trener i Nowy Plan są wymagane do edycji przypisania.");
                return;
            }
        }

        setIsLoading(true);
        try {
            if (modalMode === 'add') {
                const payload: PersonalPlanCreationPayload = {
                    userId: formData.userId!,
                    trainerId: formData.trainerId!,
                    planId: formData.planId!,
                };
                await PersonalPlanService.assignPlanToUser(payload);
            } else if (modalMode === 'edit' && currentPlanAssignment) {
                const payload: PersonalPlanUpdatePayload = {
                    newTrainerId: formData.newTrainerId!,
                    newPlanId: formData.newPlanId!,
                };
                await PersonalPlanService.updatePersonalPlanAssignment(currentPlanAssignment.personalPlanId, payload);
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

    const handleDeleteClick = (planAssignment: PersonalPlanDto) => {
        setDeletingPlanAssignment(planAssignment);
        setIsDeleteModalOpen(true);
        setError(null);
    };

    const confirmDelete = async () => {
        if (!deletingPlanAssignment) return;
        setIsLoading(true);
        setError(null);
        try {
            await PersonalPlanService.unassignPersonalPlanById(deletingPlanAssignment.personalPlanId);
            await loadData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd podczas usuwania przypisania.';
            setError(message);
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
            setDeletingPlanAssignment(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <ClipboardList className={`w-8 h-8 text-${ACCENT_COLOR}-600`} />
                        <h1 className="text-3xl font-bold text-slate-800">Zarządzanie Osobistymi Planami Treningowymi</h1>
                    </div>
                    <p className="text-gray-500">Przypisywanie, edycja i usuwanie planów treningowych dla użytkowników.</p>
                </header>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj przypisań..."
                            className={`w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal('add')}
                        className={`inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Przypisz Plan
                    </button>
                </div>

                {error && !isModalOpen && !isDeleteModalOpen && (
                    <div className={`mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center`}>
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 overflow-hidden">
                    {isLoading && personalPlans.length === 0 && !error ? (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${ACCENT_COLOR}-500`} />
                            <p>Ładowanie przypisanych planów...</p>
                        </div>
                    ) : !isLoading && paginatedPlans.length === 0 && searchTerm && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <p className="text-lg font-medium">Brak wyników dla "{searchTerm}"</p>
                        </div>
                    ) : !isLoading && personalPlans.length === 0 && !error ? (
                        <div className="p-10 text-center text-gray-500">
                            <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nie znaleziono żadnych przypisanych planów.</p>
                            <p className="text-sm">Możesz przypisać nowy plan używając przycisku powyżej.</p>
                        </div>
                    ) : paginatedPlans.length > 0 && !error ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1024px]">
                                <thead className={`bg-gray-50 border-b border-gray-200`}>
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Przyp.</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Użytkownik</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trener</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nazwa Planu</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedPlans.map((pp) => (
                                    <tr key={pp.personalPlanId} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pp.personalPlanId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{pp.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{pp.trainerName} {pp.trainerSurname}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{pp.planName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                                            <button
                                                onClick={() => handleOpenModal('edit', pp)}
                                                title="Edytuj przypisanie"
                                                className={`p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(pp)}
                                                title="Usuń przypisanie"
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
                    {totalPages > 0 && !error && filteredPlans.length > 0 && (
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
                                        {modalMode === 'add' ? 'Przypisz nowy plan treningowy' : `Edytuj przypisanie dla: ${currentPlanAssignment?.username}`}
                                    </h3>
                                    {modalMode === 'edit' && currentPlanAssignment && <p className="text-sm text-gray-500">ID Przypisania: {currentPlanAssignment.personalPlanId}</p>}
                                </div>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    {error && (
                                        <div className={`p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center`}>
                                            <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {modalMode === 'add' && (
                                        <>
                                            <div>
                                                <label htmlFor="userId_select_pp" className="block text-sm font-medium text-gray-700 mb-1">Użytkownik</label>
                                                <select id="userId_select_pp" name="userId" value={formData.userId || ''} onChange={handleFormChange} required
                                                        className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}>
                                                    <option value="" disabled>Wybierz użytkownika...</option>
                                                    {users.map(user => (
                                                        <option key={user.userId} value={user.userId}>{user.username} ({user.email})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="trainerId_select_pp" className="block text-sm font-medium text-gray-700 mb-1">Trener</label>
                                                <select id="trainerId_select_pp" name="trainerId" value={formData.trainerId || ''} onChange={handleFormChange} required
                                                        className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}>
                                                    <option value="" disabled>Wybierz trenera...</option>
                                                    {trainers.map(trainer => (
                                                        <option key={trainer.trainerId} value={trainer.trainerId}>{trainer.name} {trainer.surname}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="planId_select_pp" className="block text-sm font-medium text-gray-700 mb-1">Plan Treningowy</label>
                                                <select id="planId_select_pp" name="planId" value={formData.planId || ''} onChange={handleFormChange} required
                                                        className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}>
                                                    <option value="" disabled>Wybierz plan...</option>
                                                    {trainingPlans.map(plan => (
                                                        <option key={plan.planId} value={plan.planId}>{plan.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {modalMode === 'edit' && (
                                        <>
                                            <div>
                                                <label htmlFor="newTrainerId_select_pp" className="block text-sm font-medium text-gray-700 mb-1">Nowy Trener</label>
                                                <select id="newTrainerId_select_pp" name="newTrainerId" value={formData.newTrainerId || ''} onChange={handleFormChange} required
                                                        className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}>
                                                    <option value="" disabled>Wybierz nowego trenera...</option>
                                                    {trainers.map(trainer => (
                                                        <option key={trainer.trainerId} value={trainer.trainerId}>{trainer.name} {trainer.surname}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="newPlanId_select_pp" className="block text-sm font-medium text-gray-700 mb-1">Nowy Plan Treningowy</label>
                                                <select id="newPlanId_select_pp" name="newPlanId" value={formData.newPlanId || ''} onChange={handleFormChange} required
                                                        className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}>
                                                    <option value="" disabled>Wybierz nowy plan...</option>
                                                    {trainingPlans.map(plan => (
                                                        <option key={plan.planId} value={plan.planId}>{plan.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                    <button type="button" onClick={handleCloseModal} disabled={isLoading}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
                                        Anuluj
                                    </button>
                                    <button type="submit" disabled={isLoading}
                                            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[80px]`}>
                                        {isLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : (modalMode === 'add' ? 'Przypisz Plan' : 'Zapisz zmiany')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDeleteModalOpen && deletingPlanAssignment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-5">
                                <div className="flex items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Usuń przypisanie planu
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Czy na pewno chcesz usunąć przypisanie planu <span className="font-semibold">"{deletingPlanAssignment.planName}"</span> dla użytkownika <span className="font-semibold">{deletingPlanAssignment.username}</span>?
                                                Tej operacji nie można cofnąć.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 rounded-b-xl">
                                <button type="button" onClick={confirmDelete} disabled={isLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 min-w-[100px]">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Usuń przypisanie'}
                                </button>
                                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeletingPlanAssignment(null); setError(null);}} disabled={isLoading}
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

export default PersonalPlanManagementPage;