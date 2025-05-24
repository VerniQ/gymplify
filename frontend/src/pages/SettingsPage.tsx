import React, { useState } from 'react';
import SidebarComponent from "../components/SidebarComponent";
import { Settings, User, Lock, BellRing, Palette } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-slate-700 mb-3">Informacje o profilu</h3>
                        <p className="text-sm text-gray-600">Tutaj możesz edytować swoje dane osobowe, zdjęcie profilowe itp.</p>
                    </div>
                );
            case 'security':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-slate-700 mb-3">Bezpieczeństwo</h3>
                        <p className="text-sm text-gray-600">Zmień hasło, zarządzaj dwuetapową weryfikacją.</p>
                    </div>
                );
            case 'notifications':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-slate-700 mb-3">Powiadomienia</h3>
                        <p className="text-sm text-gray-600">Skonfiguruj, jakie powiadomienia chcesz otrzymywać.</p>
                    </div>
                );
            case 'appearance':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-slate-700 mb-3">Wygląd</h3>
                        <p className="text-sm text-gray-600">Dostosuj motyw aplikacji (np. tryb ciemny/jasny, kolory akcentów).</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'security', label: 'Bezpieczeństwo', icon: Lock },
        { id: 'notifications', label: 'Powiadomienia', icon: BellRing },
        { id: 'appearance', label: 'Wygląd', icon: Palette },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <Settings size={32} className="mr-3 text-gray-500" />
                        Ustawienia
                    </h1>
                    <p className="text-gray-500 mt-1">Zarządzaj swoim kontem i preferencjami aplikacji.</p>
                </header>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200/80">
                    <div className="flex border-b border-gray-200/80">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium flex items-center space-x-2
                                    ${activeTab === tab.id
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                                }
                                `}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="p-6">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;