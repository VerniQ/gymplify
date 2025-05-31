import React from 'react';
import AdminSidebarComponent from "../../components/admin/AdminSidebarComponent";
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    UserCog,
    CalendarDays,
    Dumbbell,
    ClipboardList,
    FileUser,
    LayoutGrid,
    Activity,
    ListChecks
} from 'lucide-react';

interface StatCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, description, icon: Icon, color, link }) => {
    const bgColor = `bg-${color}-500`;
    const hoverBgColor = `hover:bg-${color}-600`;
    const ringColor = `focus:ring-${color}-400`;
    const iconTextColor = `text-${color}-500`;
    const iconBgColor = `bg-${color}-100`;
    const hoverIconBgColor = `group-hover:bg-${color}-200`;

    const cardContent = (
        <div className="flex flex-col justify-between h-full">
            <div>
                <div className={`mb-4 inline-flex items-center justify-center p-3 rounded-xl ${iconBgColor} ${hoverIconBgColor} transition-colors duration-300`}>
                    <Icon className={`w-7 h-7 ${iconTextColor}`} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
        </div>
    );

    if (link) {
        return (
            <a
                href={link}
                className={`group relative flex flex-col bg-white p-5 rounded-xl shadow-md border border-gray-200/70 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 ${ringColor} focus:ring-offset-2`}
            >
                {cardContent}
                <span className={`absolute bottom-3 right-3 px-2 py-1 text-xs font-semibold text-white ${bgColor} ${hoverBgColor} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    Przejdź
                </span>
            </a>
        );
    }
    return (
        <div className={`group relative flex flex-col bg-white p-5 rounded-xl shadow-md border border-gray-200/70 transition-all duration-300`}>
            {cardContent}
        </div>
    );
};

const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();

    const adminManagementTiles = [
        { title: "Zarządzanie Użytkownikami", description: "Konta, role i uprawnienia.", icon: Users, color: "blue", link: "/admin/user-management" },
        { title: "Profile Trenerów", description: "Dane, specjalizacje, dostępność.", icon: UserCog, color: "indigo", link: "/admin/trainer-management" },
        { title: "Sesje Treningowe", description: "Planowanie i zarządzanie grafikiem.", icon: CalendarDays, color: "purple", link: "/admin/trainer-sessions" },
        { title: "Baza Ćwiczeń", description: "Dodawanie i kategoryzacja ćwiczeń.", icon: Dumbbell, color: "green", link: "/admin/exercises" },
        { title: "Grupy Mięśniowe", description: "Definiowanie i zarządzanie kategoriami.", icon: ListChecks, color: "pink", link: "/admin/muscle-groups" },
        { title: "Szablony Planów", description: "Tworzenie i edycja gotowych schematów.", icon: ClipboardList, color: "teal", link: "/admin/training-plans" },
        { title: "Plany Osobiste", description: "Przypisywanie i monitorowanie postępów.", icon: FileUser, color: "cyan", link: "/admin/personal-plans" },
        { title: "Statystyki i Raporty", description: "Analiza danych i raportowanie.", icon: Activity, color: "orange", link: "/admin/statistics" }
    ];

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-gray-200">
            <AdminSidebarComponent />

            <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
                <header className="mb-10">
                    <div className="flex items-center space-x-4 text-slate-800">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <LayoutGrid className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold">
                                Panel Administratora
                            </h1>
                            <p className="text-gray-600 mt-1 text-lg">
                                Witaj{user?.username ? `, ${user.username}` : ''}! Przegląd systemu Gymplify.
                            </p>
                        </div>
                    </div>
                </header>

                <section>
                    <h2 className="text-2xl font-semibold text-slate-700 mb-6 flex items-center">
                        <Activity className="w-7 h-7 mr-3 text-purple-500" /> Moduły Zarządzania Systemem
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {adminManagementTiles.map((tile) => (
                            <StatCard
                                key={tile.title}
                                title={tile.title}
                                description={tile.description}
                                icon={tile.icon}
                                color={tile.color}
                                link={tile.link}
                            />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboardPage;