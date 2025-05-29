import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext.tsx";
import {
    LogOut,
    LayoutDashboard,
    Users,
    UserCog,
    CalendarDays,
    Dumbbell as ExerciseIcon,
    ClipboardList,
    ListChecks,
    Search,
    ChevronLeft,
    UserCircle,
    DumbbellIcon,
    ArrowRightLeft,
    BarChart3 as StatisticsIcon
} from 'lucide-react';

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
}

const AdminSidebarComponent: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeItem, setActiveItem] = useState<string>(location.pathname);
    const { user, logout } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (location.pathname.startsWith('/admin/statistics')) {
            setActiveItem('/admin/statistics');
        } else if (location.pathname.startsWith('/admin/') && location.pathname !== '/admin') {
            setActiveItem(location.pathname);
        } else if (location.pathname === '/admin') {
            setActiveItem('/admin');
        } else {
            setActiveItem(location.pathname);
        }
    }, [location.pathname]);

    const menuItems: MenuItem[] = [
        { id: '/admin', label: 'Pulpit Admina', icon: LayoutDashboard, path: '/admin' },
        { id: '/admin/user-management', label: 'Zarządzanie Użytkownikami', icon: Users, path: '/admin/user-management' },
        { id: '/admin/trainer-management', label: 'Zarządzanie Trenerami', icon: UserCog, path: '/admin/trainer-management' },
        { id: '/admin/trainer-sessions', label: 'Sesje Trenerów', icon: CalendarDays, path: '/admin/trainer-sessions' },
        { id: '/admin/exercises', label: 'Ćwiczenia', icon: ExerciseIcon, path: '/admin/exercises' },
        { id: '/admin/muscle-groups', label: 'Grupy Mięśniowe', icon: ListChecks, path: '/admin/muscle-groups' },
        { id: '/admin/training-plans', label: 'Szablony Planów', icon: ClipboardList, path: '/admin/training-plans' },
        { id: '/admin/statistics', label: 'Statystyki Aplikacji', icon: StatisticsIcon, path: '/admin/statistics' },
    ];

    const roleMap: { [key: string]: string } = {
        USER: 'Użytkownik',
        ADMIN: 'Administrator',
        TRAINER: 'Trener',
    };

    const accentColor = 'blue';

    const handleLogout = () => {
        logout();
    };

    const switchToUserDashboard = () => {
        navigate('/dashboard');
    };

    const filteredMenuItems = menuItems.filter(item =>
        isSidebarCollapsed || item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`
            ${isSidebarCollapsed ? 'w-[76px]' : 'w-64'}
            h-screen bg-white
            flex flex-col
            border-r border-gray-200/70
            transition-all duration-300 ease-in-out shadow-lg
            relative
        `}>
            <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`
                    absolute top-5 -right-3.5 z-10
                    w-7 h-7 bg-white text-${accentColor}-600
                    border border-gray-200/80
                    rounded-full flex items-center justify-center
                    shadow-md hover:bg-gray-50 hover:border-gray-300
                    transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-${accentColor}-500
                `}
                aria-label={isSidebarCollapsed ? "Rozwiń sidebar" : "Zwiń sidebar"}
            >
                <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} strokeWidth={2.5}/>
            </button>

            <div className={`
                flex items-center
                ${isSidebarCollapsed ? 'justify-center h-[68px] p-3' : 'space-x-2.5 h-[68px] px-4 py-3'}
                border-b border-gray-200/70
                flex-shrink-0
            `}>
                <div className={`bg-${accentColor}-600 p-1.5 rounded-lg flex-shrink-0 shadow-sm`}>
                    <DumbbellIcon className="w-6 h-6 text-white" />
                </div>
                {!isSidebarCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-semibold text-slate-800 whitespace-nowrap">
                            Gymplify Admin
                        </h1>
                        <p className="text-xs text-gray-500 whitespace-nowrap -mt-0.5">Panel Zarządzania</p>
                    </div>
                )}
            </div>

            {!isSidebarCollapsed && (
                <div className="p-4 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" strokeWidth={2}/>
                        <input
                            type="text"
                            placeholder="Szukaj w menu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`
                                w-full pl-10 pr-3 py-2 text-sm
                                bg-gray-100/80 hover:bg-gray-100 focus:bg-white
                                border border-transparent focus:border-gray-300
                                rounded-lg text-gray-700 placeholder-gray-500
                                focus:outline-none focus:ring-1 focus:ring-${accentColor}-500
                                transition-all duration-200
                            `}
                        />
                    </div>
                </div>
            )}

            <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-3 space-y-1">
                {filteredMenuItems.map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        title={item.label}
                        className={`
                            w-full flex items-center px-3 py-2.5 rounded-lg
                            transition-all duration-150 ease-in-out group
                            focus:outline-none focus:ring-2 focus:ring-${accentColor}-400 focus:ring-offset-1
                            ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                            ${ activeItem === item.path
                            ? `bg-${accentColor}-600 text-white font-semibold shadow-md hover:bg-${accentColor}-700`
                            : `text-gray-500 hover:bg-gray-100 hover:text-gray-800`
                        }`}
                        onClick={() => {
                            setActiveItem(item.path);
                            setSearchTerm('');
                        }}
                    >
                        <item.icon
                            className={`
                                flex-shrink-0 w-5 h-5
                                ${activeItem === item.path
                                ? 'text-white'
                                : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                            strokeWidth={activeItem === item.path ? 2.2 : 2}
                        />
                        {!isSidebarCollapsed && <span className="text-sm">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="p-3 border-t border-gray-200/70 flex-shrink-0 space-y-1.5">
                {!isSidebarCollapsed && user && (
                    <div className="flex items-center p-1.5 rounded-md mb-1">
                        <div className={`
                            w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
                            bg-white text-${accentColor}-700 border-2 border-${accentColor}-500 shadow-sm
                        `}>
                            {user.username ? user.username.substring(0, 1).toUpperCase() : <UserCircle size={20}/>}
                        </div>
                        <div className="ml-2.5 overflow-hidden">
                            <p className="text-sm font-medium text-slate-700 truncate" title={user.username || user.email}>
                                {user.username || user.email}
                            </p>
                            <p className="text-xs text-gray-500 -mt-0.5">
                                {user.role ? (roleMap[user.role.toUpperCase()] || user.role) : 'Brak roli'}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={switchToUserDashboard}
                    title="Przełącz na Dashboard Użytkownika"
                    className={`
                        w-full flex items-center px-3 py-2.5 rounded-lg
                        text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-800
                        transition-colors duration-150 ease-in-out group
                        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1
                        ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                >
                    <ArrowRightLeft className="flex-shrink-0 w-5 h-5 text-gray-500 group-hover:text-gray-600" strokeWidth={2} />
                    {!isSidebarCollapsed && <span className="text-sm">Dashboard Użytkownika</span>}
                </button>

                <button
                    onClick={handleLogout}
                    title="Wyloguj się"
                    className={`
                        w-full flex items-center px-3 py-2.5 rounded-lg
                        text-gray-600 hover:bg-red-100 hover:text-red-700
                        transition-colors duration-150 ease-in-out group
                        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
                        ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                >
                    <LogOut className="flex-shrink-0 w-5 h-5 text-gray-500 group-hover:text-red-600" strokeWidth={2} />
                    {!isSidebarCollapsed && <span className="text-sm">Wyloguj się</span>}
                </button>
            </div>
        </div>
    );
};

export default AdminSidebarComponent;