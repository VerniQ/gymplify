import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebarComponent from '../../../components/admin/AdminSidebarComponent';
import { StatisticsService } from '../../../services/StatisticsService';
import {
    RoleStat,
    SpecializationStat,
    TrainerWorkload,
    ExercisePopularity,
    SystemActivityCount,
    PopularPlanDto,
    ExerciseCountByMuscleGroupDto
} from '../../../types/StatisticsTypes';
import {
    BarChart as BarChartLucideIcon,
    PieChart as PieChartLucideIcon,
    Users,
    UserCog,
    Dumbbell,
    ListChecks,
    AlertTriangle,
    Loader2,
    ClipboardList
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const ACCENT_COLOR = 'blue';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = ACCENT_COLOR }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 flex items-center space-x-4 hover:shadow-xl transition-shadow`}>
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
            <Icon size={28} strokeWidth={1.5} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-semibold text-slate-800">{value}</p>
        </div>
    </div>
);

const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D', '#FFC0CB', '#A0522D', '#FA8072', '#20B2AA'];

const AdminStatisticsPage: React.FC = () => {
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [totalTrainers, setTotalTrainers] = useState<number | null>(null);
    const [roleStats, setRoleStats] = useState<RoleStat[]>([]);
    const [specializationStats, setSpecializationStats] = useState<SpecializationStat[]>([]);
    const [trainerWorkload, setTrainerWorkload] = useState<TrainerWorkload[]>([]);
    const [popularExercisesPlans, setPopularExercisesPlans] = useState<ExercisePopularity[]>([]);
    const [systemActivity, setSystemActivity] = useState<SystemActivityCount[]>([]);
    const [exerciseCountByMuscleGroup, setExerciseCountByMuscleGroup] = useState<ExerciseCountByMuscleGroupDto[]>([]);
    const [mostAssignedPlans, setMostAssignedPlans] = useState<PopularPlanDto[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllStatistics = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (!StatisticsService) {
                    throw new Error("StatisticsApiService is not available. Check import.");
                }

                const [
                    usersTotalData,
                    trainersTotalData,
                    rolesData,
                    specializationsData,
                    workloadData,
                    popExPlansData,
                    sysActivityData,
                    exCountByGroupData,
                    mostAssignedPlansData,
                ] = await Promise.all([
                    StatisticsService.getTotalUserCount(),
                    StatisticsService.getTotalTrainerCount(),
                    StatisticsService.getUserCountByRole(),
                    StatisticsService.getTrainerCountBySpecialization(),
                    StatisticsService.getTrainerWorkloadStats(),
                    StatisticsService.getMostPopularExercisesInPlans(5),
                    StatisticsService.getOverallSystemActivityCounts(),
                    StatisticsService.getExerciseCountByMuscleGroup(),
                    StatisticsService.getMostAssignedTrainingPlans(5),
                ]);

                setTotalUsers(usersTotalData);
                setTotalTrainers(trainersTotalData);
                setRoleStats(rolesData);
                setSpecializationStats(specializationsData);
                setTrainerWorkload(workloadData);
                setPopularExercisesPlans(popExPlansData);
                setSystemActivity(sysActivityData);
                setExerciseCountByMuscleGroup(exCountByGroupData);
                setMostAssignedPlans(mostAssignedPlansData);

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas ładowania statystyk.';
                setError(message);
                console.error("Błąd ładowania statystyk:", err);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchAllStatistics();
    }, []);

    const systemActivityMap = useMemo(() => {
        const map = new Map<string, number>();
        if (systemActivity && Array.isArray(systemActivity)) {
            systemActivity.forEach(item => map.set(item.metric, item.countValue));
        }
        return map;
    }, [systemActivity]);

    const specializationPieData = useMemo(() => {
        if (specializationStats && Array.isArray(specializationStats)) {
            return specializationStats.map(stat => ({ name: stat.specialization, value: stat.trainerCount }));
        }
        return [];
    }, [specializationStats]);

    const exerciseCountByMuscleGroupPieData = useMemo(() => {
        if (exerciseCountByMuscleGroup && Array.isArray(exerciseCountByMuscleGroup)) {
            return exerciseCountByMuscleGroup.map(stat => ({ name: stat.groupName, value: stat.exerciseCount }));
        }
        return [];
    }, [exerciseCountByMuscleGroup]);


    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
                <AdminSidebarComponent />
                <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className={`w-16 h-16 animate-spin text-${ACCENT_COLOR}-500 mb-4`} />
                        <p className="text-xl text-gray-600">Ładowanie statystyk...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
                <AdminSidebarComponent />
                <main className="flex-1 p-6 md:p-8">
                    <div className={`my-8 p-6 text-lg text-red-700 bg-red-100 border border-red-400 rounded-xl shadow-md flex items-center justify-center`}>
                        <AlertTriangle size={40} className="mr-4 flex-shrink-0" />
                        <div>
                            <h2 className="font-semibold mb-1">Błąd ładowania statystyk</h2>
                            <p className="text-base">{error}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <AdminSidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <BarChartLucideIcon className={`w-8 h-8 text-${ACCENT_COLOR}-600`} />
                        <h1 className="text-3xl font-bold text-slate-800">Panel Statystyk</h1>
                    </div>
                    <p className="text-gray-500">Przegląd kluczowych wskaźników aplikacji Gymplify.</p>
                </header>

                <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <StatCard title="Wszyscy Użytkownicy" value={totalUsers ?? 'N/A'} icon={Users} color={ACCENT_COLOR} />
                    <StatCard title="Wszyscy Trenerzy" value={totalTrainers ?? 'N/A'} icon={UserCog} color={ACCENT_COLOR} />
                    <StatCard title="Grupy Mięśniowe" value={systemActivityMap.get('Total Muscle Groups') ?? 'N/A'} icon={ListChecks} color="green" />
                    <StatCard title="Ćwiczenia" value={systemActivityMap.get('Total Exercises') ?? 'N/A'} icon={Dumbbell} color="purple" />
                    <StatCard title="Plany Treningowe" value={systemActivityMap.get('Total Training Plans') ?? 'N/A'} icon={ClipboardList} color="yellow" />
                </section>

                <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-200/80 min-h-[350px]">
                        <h2 className="text-xl font-semibold text-slate-700 mb-1 flex items-center">
                            <Users size={22} className={`mr-2 text-${ACCENT_COLOR}-500`}/> Użytkownicy wg Ról
                        </h2>
                        {roleStats && roleStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={roleStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis dataKey="roleName" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(100,100,200,0.1)' }}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="userCount" name="Liczba użytkowników" fill={`#${ACCENT_COLOR === 'blue' ? '3B82F6' : '10B981'}`} radius={[4, 4, 0, 0]} barSize={40}/>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-sm text-gray-500 pt-4">Brak danych do wyświetlenia wykresu.</p>}
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-200/80 min-h-[350px]">
                        <h2 className="text-xl font-semibold text-slate-700 mb-1 flex items-center">
                            <PieChartLucideIcon size={22} className={`mr-2 text-green-500`}/> Trenerzy wg Specjalizacji
                        </h2>
                        {specializationPieData && specializationPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={specializationPieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }: { name: string, percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {specializationPieData.map((_entry, index: number) => (
                                            <Cell key={`cell-spec-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="text-sm text-gray-500 pt-4">Brak danych do wyświetlenia wykresu.</p>}
                    </div>
                </section>

                <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-200/80 min-h-[350px]">
                        <h2 className="text-xl font-semibold text-slate-700 mb-1 flex items-center">
                            <Dumbbell size={22} className={`mr-2 text-purple-500`}/> Ćwiczenia wg Grup Mięśniowych
                        </h2>
                        {exerciseCountByMuscleGroupPieData && exerciseCountByMuscleGroupPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={exerciseCountByMuscleGroupPieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }: { name: string, percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {exerciseCountByMuscleGroupPieData.map((_entry, index: number) => (
                                            <Cell key={`cell-ex-group-${index}`} fill={PIE_CHART_COLORS[(index + 2) % PIE_CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '12px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="text-sm text-gray-500 pt-4">Brak danych do wyświetlenia wykresu.</p>}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                        <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                            <ClipboardList size={22} className={`mr-2 text-yellow-500`}/> Top 5 Najczęściej Przypisywanych Planów
                        </h2>
                        {mostAssignedPlans && mostAssignedPlans.length > 0 ? (
                            <ul className="space-y-1">
                                {mostAssignedPlans.map((plan: PopularPlanDto, idx: number) => (
                                    <li key={idx} className="p-2 rounded-md hover:bg-yellow-50 text-sm flex justify-between">
                                        <span className="font-medium text-gray-800">{plan.planName}</span>
                                        <span className="text-xs text-gray-600 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{plan.assignmentsCount} przypisań</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">Brak danych.</p>}
                    </div>
                </section>


                <section className="mb-10 bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                        <UserCog size={22} className={`mr-2 text-indigo-500`}/> Obciążenie Trenerów
                    </h2>
                    {trainerWorkload && trainerWorkload.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trener</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specjalizacja</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Klienci</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sesje (łącznie)</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sesje (nast. 7 dni)</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {trainerWorkload.map((trainer: TrainerWorkload) => (
                                    <tr key={trainer.trainerId} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{trainer.trainerFullName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{trainer.specialization || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{trainer.assignedClientsCount}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{trainer.totalScheduledSessions}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{trainer.sessionsNext7Days}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ): <p className="text-sm text-gray-500">Brak danych o obciążeniu trenerów.</p>}
                </section>

                <section className="mb-10 bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                        <Dumbbell size={22} className={`mr-2 text-red-500`}/> Top 5 Ćwiczeń w Planach
                    </h2>
                    {popularExercisesPlans && popularExercisesPlans.length > 0 ? (
                        <ul className="space-y-1">
                            {popularExercisesPlans.map((ex: ExercisePopularity, idx: number) => (
                                <li key={idx} className="p-2 rounded-md hover:bg-red-50 text-sm flex justify-between">
                                    <div>
                                        <span className="font-medium text-gray-800">{ex.exerciseName}</span>
                                        <span className="text-xs text-gray-500 ml-2">({ex.muscleGroup})</span>
                                    </div>
                                    <span className="text-xs text-gray-600 bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{ex.countValue} razy w planach</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500">Brak danych.</p>}
                </section>

            </main>
        </div>
    );
};

export default AdminStatisticsPage;