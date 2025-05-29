// src/pages/admin/trainer-sessions/TrainerSessionsPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { TrainerSessionService } from '../../../services/TrainerSessionService';
import { AdminTrainerService } from '../../../services/AdminTrainerService';
import { TrainerSession, CreateTrainerSessionPayload, UpdateTrainerSessionPayload, CalendarEvent } from '../../../types/TrainerSessionTypes';
import { TrainerAdminView } from '../../../types/TrainerAdminTypes';
import {
    PlusCircle,
    CalendarDays,
    Loader2,
    AlertTriangle,
    Edit3,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    List as ClipboardList
} from 'lucide-react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo, Event as BigCalendarEventDefinition, View as BigCalendarView } from 'react-big-calendar'; // Zmieniono alias dla View
import { format, parse, startOfWeek, getDay, addHours, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { pl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'pl': pl };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date: Date) => startOfWeek(date, { locale: pl }), getDay, locales });

const ITEMS_PER_PAGE = 10;
const ACCENT_COLOR = 'blue';
const CALENDAR_EVENT_TEXT_COLOR = 'text-white';

type CalendarViewType = typeof Views.MONTH | typeof Views.WEEK | typeof Views.DAY; // Usunięto AGENDA


const TrainerSessionsPage: React.FC = () => {
    const [sessions, setSessions] = useState<TrainerSession[]>([]);
    const [allTrainers, setAllTrainers] = useState<TrainerAdminView[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [filterTrainerId, setFilterTrainerId] = useState<string>('all');
    const [filterFromDate, setFilterFromDate] = useState<string>('');
    const [filterToDate, setFilterToDate] = useState<string>('');

    const [overallViewMode, setOverallViewMode] = useState<'list' | 'calendar'>('calendar');
    const [calendarInternalView, setCalendarInternalView] = useState<CalendarViewType>(Views.WEEK);
    const [calendarDate, setCalendarDate] = useState<Date>(new Date());


    const [currentPage, setCurrentPage] = useState<number>(1);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentSession, setCurrentSession] = useState<TrainerSession | null>(null);
    const [formData, setFormData] = useState<Partial<CreateTrainerSessionPayload & UpdateTrainerSessionPayload & { scheduleId?: number }>>({});

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingSession, setDeletingSession] = useState<TrainerSession | null>(null);

    const minTime = useMemo(() => setMilliseconds(setSeconds(setMinutes(setHours(new Date(), 7), 0), 0), 0), []);
    const maxTime = useMemo(() => setMilliseconds(setSeconds(setMinutes(setHours(new Date(), 22), 0), 0), 0), []);


    const handleOpenModal = useCallback((mode: 'add' | 'edit', session?: TrainerSession, slotInfo?: SlotInfo) => {
        setError(null);
        setModalMode(mode);
        if (mode === 'edit' && session) {
            setCurrentSession(session);
            setFormData({
                scheduleId: session.scheduleId,
                trainerId: session.trainerId,
                sessionDate: format(new Date(session.sessionDate), 'yyyy-MM-dd'),
                startTime: format(new Date(session.startTime), 'HH:mm'),
                endTime: format(new Date(session.endTime), 'HH:mm'),
            });
        } else if (mode === 'add' && slotInfo) {
            setCurrentSession(null);
            const defaultEndTime = addHours(slotInfo.start, 1);
            setFormData({
                trainerId: allTrainers.length > 0 ? allTrainers[0].trainerId : undefined,
                sessionDate: format(slotInfo.start, 'yyyy-MM-dd'),
                startTime: format(slotInfo.start, 'HH:mm'),
                endTime: format(defaultEndTime > maxTime && slotInfo.start < maxTime ? maxTime : defaultEndTime, 'HH:mm'),
            });
        } else {
            setCurrentSession(null);
            setFormData({
                trainerId: allTrainers.length > 0 ? allTrainers[0].trainerId : undefined,
                sessionDate: format(new Date(), 'yyyy-MM-dd'),
                startTime: '09:00',
                endTime: '10:00',
            });
        }
        setIsModalOpen(true);
    }, [allTrainers, maxTime]);

    const loadSessions = useCallback(async (currentTrainers: TrainerAdminView[]) => {
        setIsLoading(true);
        setError(null);
        try {
            let sessionsData;
            const from = filterFromDate || undefined;
            const to = filterToDate || undefined;

            if (filterTrainerId && filterTrainerId !== "all") {
                sessionsData = await TrainerSessionService.getTrainerSessionsByTrainer(Number(filterTrainerId), from, to);
            } else {
                sessionsData = await TrainerSessionService.getAllTrainerSessions(from, to);
            }

            const sessionsWithMappedNames = sessionsData.map(s => {
                const trainer = currentTrainers.find(t => t.trainerId === s.trainerId);
                return {
                    ...s,
                    trainerName: trainer ? trainer.name : s.trainerName || 'Nieznany',
                    trainerSurname: trainer ? trainer.surname : s.trainerSurname || 'Trener',
                };
            });

            setSessions(sessionsWithMappedNames.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas ładowania sesji.';
            setError(message);
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    }, [filterTrainerId, filterFromDate, filterToDate]);


    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const trainersData = await AdminTrainerService.getAllTrainerProfiles();
                setAllTrainers(trainersData);
                await loadSessions(trainersData);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas inicjalizacji danych.';
                setError(message);
                setAllTrainers([]);
                setSessions([]);
            }
        };
        fetchInitialData().catch(console.error);
    }, [loadSessions]);


    const filteredSessions = sessions;

    const paginatedSessions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSessions, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));

    const calendarEvents: CalendarEvent[] = useMemo(() => {
        return sessions.map((session): CalendarEvent => ({
            id: session.scheduleId,
            title: `${session.trainerName} ${session.trainerSurname}`,
            start: new Date(session.startTime),
            end: new Date(session.endTime),
            allDay: false,
            resource: session.trainerId,
            trainerId: session.trainerId,
            trainerName: session.trainerName,
            trainerSurname: session.trainerSurname,
        }));
    }, [sessions]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSession(null);
        setFormData({});
        setError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'trainerId' ? Number(value) : value }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.trainerId || !formData.sessionDate || !formData.startTime || !formData.endTime) {
            setError("Wszystkie pola są wymagane.");
            return;
        }
        if (formData.startTime >= formData.endTime) {
            setError("Czas zakończenia musi być późniejszy niż czas rozpoczęcia.");
            return;
        }
        setError(null);
        setIsFormLoading(true);

        const payload: CreateTrainerSessionPayload | UpdateTrainerSessionPayload = {
            trainerId: Number(formData.trainerId),
            sessionDate: formData.sessionDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
        };

        try {
            if (modalMode === 'add') {
                await TrainerSessionService.createTrainerSession(payload as CreateTrainerSessionPayload);
            } else if (modalMode === 'edit' && currentSession) {
                await TrainerSessionService.updateTrainerSession(currentSession.scheduleId, payload as UpdateTrainerSessionPayload);
            }
            await loadSessions(allTrainers);
            handleCloseModal();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił błąd zapisu.';
            setError(message);
        } finally {
            setIsFormLoading(false);
        }
    };

    const handleDeleteSessionClick = (session: TrainerSession) => {
        setDeletingSession(session);
        setIsDeleteModalOpen(true);
        setError(null);
    };

    const confirmDeleteSession = async () => {
        if (!deletingSession) return;
        setIsFormLoading(true);
        setError(null);
        const initialFilteredSessionCount = filteredSessions.length;
        try {
            await TrainerSessionService.deleteTrainerSession(deletingSession.scheduleId);
            await loadSessions(allTrainers);

            const newTotalItems = initialFilteredSessionCount -1 < 0 ? 0 : initialFilteredSessionCount -1;
            const newTotalPages = Math.max(1, Math.ceil(newTotalItems / ITEMS_PER_PAGE));

            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            } else if (paginatedSessions.length === 1 && currentPage > 1 && newTotalItems > 0 && newTotalItems % ITEMS_PER_PAGE === 0) {
                setCurrentPage(currentPage -1);
            } else if (newTotalItems === 0) {
                setCurrentPage(1);
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Błąd podczas usuwania.';
            setError(message);
        } finally {
            setIsFormLoading(false);
            setIsDeleteModalOpen(false);
            setDeletingSession(null);
        }
    };

    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        if (allTrainers.length === 0) {
            setError("Proszę najpierw dodać trenerów.");
            return;
        }
        handleOpenModal('add', undefined, slotInfo);
    }, [allTrainers, handleOpenModal]);

    const handleSelectEvent = useCallback((event: BigCalendarEventDefinition) => {
        const typedEvent = event as CalendarEvent;
        const session = sessions.find(s => s.scheduleId === typedEvent.id);
        if (session) {
            handleOpenModal('edit', session);
        }
    }, [sessions, handleOpenModal]);

    const formatDateForDisplay = (dateString: string) => format(new Date(dateString), 'dd.MM.yyyy');
    const formatTimeForDisplay = (timeString: string) => format(new Date(timeString), 'HH:mm');

    const eventPropGetter = useCallback(
        (event: BigCalendarEventDefinition): React.HTMLAttributes<HTMLDivElement> => {
            const typedEvent = event as CalendarEvent;
            const trainerColors = [
                'blue', 'green', 'teal', 'cyan', 'sky',
                'indigo', 'violet', 'fuchsia', 'rose'
            ];
            const colorIntensity = 500;
            const colorIndex = typedEvent.trainerId % trainerColors.length;
            const baseColor = trainerColors[colorIndex];

            const bgColorClass = `bg-${baseColor}-${colorIntensity}`;
            const borderColorClass = `border-${baseColor}-${colorIntensity + 100 > 900 ? 900 : colorIntensity + 100}`;

            return {
                className: `${bgColorClass} ${CALENDAR_EVENT_TEXT_COLOR} p-1 rounded border ${borderColorClass} text-xs leading-tight hover:opacity-80 transition-opacity`,
            };
        },
        []
    );

    const handleCalendarNavigate = useCallback((newDate: Date)=> {
        setCalendarDate(newDate);
        // onNavigate jest wywoływane przez wewnętrzne przyciski kalendarza (Poprzedni, Następny, Dziś)
        // oraz gdy zmienia się widok przez toolbar kalendarza.
        // Nie chcemy tutaj zmieniać overallViewMode.
    }, []);

    const handleCalendarViewChange = useCallback((newView: BigCalendarView) => {
        setCalendarInternalView(newView as CalendarViewType);
        // Jeśli użytkownik wybrał "Agenda" (której nie ma w naszym CalendarViewType, ale react-big-calendar może ją mieć domyślnie)
        // to przełączamy na widok listy. W przeciwnym razie pozostajemy w widoku kalendarza.
        if (newView === Views.AGENDA) { // Views.AGENDA to 'agenda'
            setOverallViewMode('list');
        } else {
            setOverallViewMode('calendar'); // Upewnij się, że pozostajesz w widoku kalendarza
        }
    }, []);


    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <CalendarDays className={`w-8 h-8 text-${ACCENT_COLOR}-600`} />
                        <h1 className="text-3xl font-bold text-slate-800">Zarządzanie Sesjami Trenerów</h1>
                    </div>
                    <p className="text-gray-500">Dodawaj, edytuj i przeglądaj sesje treningowe.</p>
                </header>

                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="filterTrainer" className="text-sm font-medium text-gray-700 sr-only">Trener:</label>
                        <select
                            id="filterTrainer"
                            value={filterTrainerId}
                            onChange={(e) => { setFilterTrainerId(e.target.value); setCurrentPage(1);}}
                            disabled={allTrainers.length === 0 && isLoading}
                            className={`pl-3 pr-8 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                        >
                            <option value="all">Wszyscy Trenerzy</option>
                            {allTrainers.map(trainer => (
                                <option key={trainer.trainerId} value={trainer.trainerId}>
                                    {trainer.name} {trainer.surname}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            aria-label="Data od"
                            value={filterFromDate}
                            onChange={(e) => {setFilterFromDate(e.target.value); setCurrentPage(1);}}
                            className={`px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                        />
                        <span className="text-gray-500 self-center">-</span>
                        <input
                            type="date"
                            aria-label="Data do"
                            value={filterToDate}
                            onChange={(e) => {setFilterToDate(e.target.value); setCurrentPage(1);}}
                            min={filterFromDate || undefined}
                            className={`px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`}
                        />
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0 self-start md:self-center">
                        <button
                            onClick={() => setOverallViewMode(overallViewMode === 'list' ? 'calendar' : 'list')}
                            className={`inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500`}
                        >
                            {overallViewMode === 'list' ? <CalendarDays size={18} className="mr-2" /> : <ClipboardList size={18} className="mr-2" />}
                            {overallViewMode === 'list' ? 'Kalendarz' : 'Lista'}
                        </button>
                        <button
                            onClick={() => handleOpenModal('add')}
                            disabled={allTrainers.length === 0}
                            title={allTrainers.length === 0 ? "Dodaj najpierw trenerów" : "Dodaj nową sesję"}
                            className={`inline-flex items-center justify-center px-4 py-2.5 bg-${ACCENT_COLOR}-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <PlusCircle size={18} className="mr-2" />
                            Dodaj Sesję
                        </button>
                    </div>
                </div>

                {error && !isModalOpen && !isDeleteModalOpen && (
                    <div className={`mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center`}>
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {overallViewMode === 'list' && (
                    <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 overflow-hidden">
                        {isLoading && sessions.length === 0 && !error ? (
                            <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                                <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${ACCENT_COLOR}-500`} />
                                <p>Ładowanie sesji...</p>
                            </div>
                        ) : !isLoading && filteredSessions.length === 0 && !error ? (
                            <div className="p-10 text-center text-gray-500">
                                <CalendarDays size={48} className="mx-auto mb-4 opacity-50"/>
                                <p className="text-lg font-medium">Nie znaleziono żadnych sesji dla wybranych filtrów.</p>
                            </div>
                        ) : paginatedSessions.length > 0 && !error ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead className={`bg-gray-50 border-b border-gray-200`}>
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trener</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Godziny</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedSessions.map((session) => (
                                        <tr key={session.scheduleId} className="hover:bg-gray-50/70 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                                {session.trainerName} {session.trainerSurname}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateForDisplay(session.sessionDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatTimeForDisplay(session.startTime)} - {formatTimeForDisplay(session.endTime)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                                                <button
                                                    onClick={() => handleOpenModal('edit', session)}
                                                    title="Edytuj sesję"
                                                    className={`p-1.5 text-gray-400 hover:text-${ACCENT_COLOR}-600 rounded-md hover:bg-${ACCENT_COLOR}-100/70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSessionClick(session)}
                                                    title="Usuń sesję"
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
                        {totalPages > 0 && !error && filteredSessions.length > 0 && (
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
                )}

                {overallViewMode === 'calendar' && (
                    <div className="bg-white shadow-xl rounded-xl border border-gray-200/80 p-4 md:p-6 min-h-[70vh] h-auto">
                        {isLoading && sessions.length === 0 && !error ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <Loader2 className={`w-12 h-12 animate-spin mb-4 text-${ACCENT_COLOR}-500`} />
                                <p>Ładowanie kalendarza...</p>
                            </div>
                        ) : (
                            <Calendar
                                localizer={localizer}
                                events={calendarEvents}
                                startAccessor="start"
                                endAccessor="end"
                                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                                style={{ height: 'calc(70vh - 4rem)' }}
                                culture='pl'
                                min={minTime}
                                max={maxTime}
                                date={calendarDate}
                                view={calendarInternalView}
                                onNavigate={handleCalendarNavigate}
                                onView={handleCalendarViewChange}
                                messages={{
                                    next: "Następny",
                                    previous: "Poprzedni",
                                    today: "Dziś",
                                    month: "Miesiąc",
                                    week: "Tydzień",
                                    day: "Dzień",
                                    agenda: "Lista",
                                    date: "Data",
                                    time: "Godzina",
                                    event: "Sesja",
                                    noEventsInRange: "Brak sesji w tym zakresie.",
                                    showMore: (total: number) => `+ ${total} więcej`,
                                }}
                                selectable
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent as (event: object, e: React.SyntheticEvent<HTMLElement>) => void}
                                eventPropGetter={eventPropGetter}
                                components={{
                                    toolbar: (toolbarProps) => {
                                        const goToBack = () => toolbarProps.onNavigate('PREV');
                                        const goToNext = () => toolbarProps.onNavigate('NEXT');
                                        const goToCurrent = () => toolbarProps.onNavigate('TODAY');
                                        const label = () => toolbarProps.label;
                                        const availableViews = toolbarProps.views as CalendarViewType[];
                                        return (
                                            <div className="rbc-toolbar mb-4 p-2 border-b flex flex-wrap items-center justify-between">
                                                <div className="rbc-btn-group">
                                                    <button type="button" onClick={goToBack} className={`px-3 py-1 text-sm border rounded-l-md hover:bg-gray-100 bg-white text-gray-700`}>Poprzedni</button>
                                                    <button type="button" onClick={goToCurrent} className={`px-3 py-1 text-sm border-t border-b hover:bg-gray-100 bg-white text-gray-700 font-semibold text-${ACCENT_COLOR}-600`}>Dziś</button>
                                                    <button type="button" onClick={goToNext} className={`px-3 py-1 text-sm border rounded-r-md hover:bg-gray-100 bg-white text-gray-700`}>Następny</button>
                                                </div>
                                                <div className="rbc-toolbar-label text-xl font-semibold text-gray-700">{label()}</div>
                                                <div className="rbc-btn-group">
                                                    {availableViews.map(viewName => (
                                                        <button
                                                            key={viewName}
                                                            type="button"
                                                            className={`px-3 py-1 text-sm border first:rounded-l-md last:rounded-r-md hover:bg-gray-100 
                                                            ${calendarInternalView === viewName ? `bg-${ACCENT_COLOR}-500 text-white hover:bg-${ACCENT_COLOR}-600` : 'bg-white text-gray-700'}`}
                                                            onClick={() => toolbarProps.onView(viewName)}
                                                        >
                                                            {viewName === Views.MONTH ? 'Miesiąc' :
                                                             viewName === Views.WEEK ? 'Tydzień' :
                                                             viewName === Views.DAY ? 'Dzień' : viewName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                }}
                            />
                        )}
                    </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                            <form onSubmit={handleSaveChanges}>
                                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-slate-700">
                                        {modalMode === 'add' ? 'Dodaj nową sesję' : `Edytuj sesję`}
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
                                        <label htmlFor="trainerId_modal_session" className="block text-sm font-medium text-gray-700 mb-1">Trener</label>
                                        <select
                                            id="trainerId_modal_session"
                                            name="trainerId"
                                            value={formData.trainerId || ''}
                                            onChange={handleFormChange}
                                            required
                                            disabled={isFormLoading || allTrainers.length === 0}
                                            className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500 disabled:bg-gray-100`}
                                        >
                                            <option value="" disabled>Wybierz trenera...</option>
                                            {allTrainers.map(trainer => (
                                                <option key={trainer.trainerId} value={trainer.trainerId}>
                                                    {trainer.name} {trainer.surname}
                                                </option>
                                            ))}
                                        </select>
                                        {allTrainers.length === 0 && !isLoading && <p className="text-xs text-red-500 mt-1">Brak dostępnych trenerów.</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="sessionDate_modal_session" className="block text-sm font-medium text-gray-700 mb-1">Data sesji</label>
                                        <input type="date" id="sessionDate_modal_session" name="sessionDate"
                                               value={formData.sessionDate || ''} onChange={handleFormChange} required disabled={isFormLoading}
                                               className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="startTime_modal_session" className="block text-sm font-medium text-gray-700 mb-1">Czas rozpoczęcia</label>
                                            <input type="time" id="startTime_modal_session" name="startTime"
                                                   value={formData.startTime || ''} onChange={handleFormChange} required disabled={isFormLoading}
                                                   step="300"
                                                   className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                        </div>
                                        <div>
                                            <label htmlFor="endTime_modal_session" className="block text-sm font-medium text-gray-700 mb-1">Czas zakończenia</label>
                                            <input type="time" id="endTime_modal_session" name="endTime"
                                                   value={formData.endTime || ''} onChange={handleFormChange} required disabled={isFormLoading}
                                                   min={formData.startTime || undefined}
                                                   step="300"
                                                   className={`w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:border-${ACCENT_COLOR}-500`} />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                                    <button type="button" onClick={handleCloseModal} disabled={isFormLoading}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
                                        Anuluj
                                    </button>
                                    <button type="submit" disabled={isFormLoading || !formData.trainerId}
                                            className={`px-4 py-2 text-sm font-medium text-white bg-${ACCENT_COLOR}-600 rounded-lg shadow-sm hover:bg-${ACCENT_COLOR}-700 focus:outline-none focus:ring-2 focus:ring-${ACCENT_COLOR}-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center min-w-[80px]`}>
                                        {isFormLoading ? <Loader2 className={`w-5 h-5 animate-spin`} /> : (modalMode === 'add' ? 'Dodaj Sesję' : 'Zapisz zmiany')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDeleteModalOpen && deletingSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-5">
                                <div className="flex items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Usuń sesję
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Czy na pewno chcesz usunąć sesję dla <span className="font-semibold">{deletingSession.trainerName} {deletingSession.trainerSurname}</span> z dnia <span className="font-semibold">{formatDateForDisplay(deletingSession.sessionDate)}</span> o <span className="font-semibold">{formatTimeForDisplay(deletingSession.startTime)}</span>?
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
                                <button type="button" onClick={confirmDeleteSession} disabled={isFormLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 min-w-[100px]">
                                    {isFormLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Usuń'}
                                </button>
                                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeletingSession(null); setError(null);}} disabled={isFormLoading}
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

export default TrainerSessionsPage;