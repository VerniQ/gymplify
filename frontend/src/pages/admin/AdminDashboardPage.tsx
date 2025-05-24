import React from 'react';
import SidebarComponent from "../../components/admin/AdminSidebarComponent";
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    UserCog,
    CalendarDays,
    Dumbbell,
    ClipboardList,
    FileUser,
    Scale,
    Trophy,
    ListChecks, // <--- NOWA IKONA
} from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; link?: string }> = ({ title, value, icon: Icon, color, link }) => {
    const cardContent = (
        <>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500 group-hover:text-${color}-700 transition-colors duration-300">{title}</h3>
                <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 group-hover:bg-${color}-200 transition-colors duration-300`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            </div>
            <p className="text-2xl font-semibold text-gray-800 group-hover:text-${color}-800 transition-colors duration-300">{value}</p>
        </>
    );

    if (link) {
        return (
            <a href={link} className={`group block bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 hover:shadow-xl hover:border-${color}-300 transition-all duration-300`}>
                {cardContent}
            </a>
        );
    }

    return (
        <div className={`group bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 hover:shadow-xl hover:border-${color}-300 transition-all duration-300`}>
            {cardContent}
        </div>
    );
};


const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();

    const adminTiles = [
        { title: "Użytkownicy", value: "Zarządzaj", icon: Users, color: "blue", link: "/admin/users" },
        { title: "Trenerzy", value: "Zarządzaj", icon: UserCog, color: "indigo", link: "/admin/trainers" },
        { title: "Sesje Trenerów", value: "Zarządzaj", icon: CalendarDays, color: "purple", link: "/admin/sessions" },
        { title: "Ćwiczenia", value: "Zarządzaj", icon: Dumbbell, color: "green", link: "/admin/exercises" },
        { title: "Grupy Mięśniowe", value: "Zarządzaj", icon: ListChecks, color: "pink", link: "/admin/muscle-group" }, // <--- NOWY KAFELEK
        { title: "Szablony Planów", value: "Zarządzaj", icon: ClipboardList, color: "teal", link: "/admin/training-plans" },
        { title: "Plany Osobiste", value: "Zarządzaj", icon: FileUser, color: "cyan", link: "/admin/personal-plans" },
        { title: "Pomiary Wagi", value: "Zarządzaj", icon: Scale, color: "orange", link: "/admin/weight-measurements" },
        { title: "Rankingi", value: "Zarządzaj", icon: Trophy, color: "yellow", link: "/admin/leaderboards" },
    ];

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            <SidebarComponent /> {/* Zakładam, że tu będzie AdminSidebarComponent dla admina */}

            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                        Panel Administratora
                    </h1>
                    <p className="text-gray-600 mt-1 text-lg">
                        Witaj{user?.username ? `, ${user.username}` : ''}! Zarządzaj systemem.
                    </p>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {adminTiles.map((tile) => (
                        <StatCard
                            key={tile.title}
                            title={tile.title}
                            value={tile.value}
                            icon={tile.icon}
                            color={tile.color}
                            link={tile.link}
                        />
                    ))}
                </section>

                <section className="mt-12 bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Statystyki Systemu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Łączna liczba użytkowników</p>
                            <p className="text-2xl font-bold text-gray-800">Brak danych</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Aktywne sesje dzisiaj</p>
                            <p className="text-2xl font-bold text-gray-800">Brak danych</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Nowe rejestracje (ostatnie 7 dni)</p>
                            <p className="text-2xl font-bold text-gray-800">Brak danych</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboardPage;