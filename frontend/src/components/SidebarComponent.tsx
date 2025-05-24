// src/components/SidebarComponent.tsx
import React, { useState } from 'react';
import Brand from "../assets/brand.svg";
import { useAuth } from '../context/AuthContext'; // Importuj useAuth
import { LogOut } from 'lucide-react'; // Ikona wylogowania

const SidebarComponent: React.FC = () => {
    const [activeItem, setActiveItem] = useState<string>('dashboard');
    const { user, logout } = useAuth(); // Użyj user i logout z kontekstu

    const menuItems = [
        { id: 'dashboard', label: 'Strona główna' },
        { id: 'calendar', label: 'Kalendarz' },
        { id: 'training', label: 'Treningi' },
        { id: 'ranking', label: 'Ranking' }
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b">
                <img src={Brand} alt="Brand" className="h-18" /> {/* Rozważ dostosowanie wysokości */}
            </div>

            <nav className="flex-1 pt-4">
                <ul>
                    {menuItems.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveItem(item.id)}
                                className={`w-full text-left px-4 py-3 flex items-center ${
                                    activeItem === item.id
                                        ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                } transition-colors duration-150 ease-in-out`}
                            >
                                <span>{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t">
                {user && (
                    <div className="flex items-center mb-4">
                        {/* Prosty avatar placeholder */}
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-semibold">
                            {user.username ? user.username.substring(0, 1).toUpperCase() : '?'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-800">{user.username || user.email}</p>
                            <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Wyloguj się
                </button>
            </div>
        </div>
    );
};

export default SidebarComponent;