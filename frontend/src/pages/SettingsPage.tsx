import React from 'react';
import SidebarComponent from "../components/SidebarComponent";
import { useAuth } from '../context/AuthContext';
import { HardHat, AlertTriangle } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarComponent />

            <main className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col items-center justify-center">
                <div className="text-center p-10 bg-white rounded-xl shadow-xl border border-gray-200/80 max-w-lg">
                    <HardHat size={64} className="mx-auto text-yellow-500 mb-6" />
                    <h1 className="text-3xl font-bold text-slate-800 mb-3">
                        Panel Ustawień
                    </h1>
                    <p className="text-xl text-gray-600 mb-2">
                        Witaj{user?.username ? `, ${user.username}` : ''}!
                    </p>
                    <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">
                                    Strona w budowie!
                                </p>
                                <p className="text-sm">
                                    Pracujemy nad nowymi funkcjami. Wkrótce znajdziesz tutaj przegląd swojej aktywności i postępów.
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-500 mt-8 text-sm">
                        Dziękujemy za cierpliwość!
                    </p>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;