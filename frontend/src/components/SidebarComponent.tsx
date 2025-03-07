import React, { useState } from 'react';
import Brand from "../assets/brand.svg";

const SidebarComponent: React.FC = () => {
    const [activeItem, setActiveItem] = useState<string>('dashboard');

    const menuItems = [
        { id: 'dashboard', label: 'Strona główna' },
        { id: 'calendar', label: 'Kalendarz' },
        { id: 'training', label: 'Treningi' },
        { id: 'ranking', label: 'Ranking' }
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b">
                <img src={Brand} alt="Brand" className="h-18" />
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
                                }`}
                            >
                                <span>{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                    <span className="ml-2 text-sm">Profil użytkownika</span>
                </div>
            </div>
        </div>
    );
};

export default SidebarComponent;