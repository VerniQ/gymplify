import React from 'react';
import SidebarComponent from "../components/SidebarComponent";
import { Bell, CheckCircle, AlertTriangle } from 'lucide-react';

const NotificationsPage: React.FC = () => {
    const notifications = [
        { id: 1, type: 'success', message: "Twój plan treningowy został zaktualizowany.", time: "5 minut temu", read: false, icon: CheckCircle },
        { id: 2, type: 'warning', message: "Zbliża się termin odnowienia subskrypcji.", time: "2 godziny temu", read: false, icon: AlertTriangle },
        { id: 3, type: 'info', message: "Nowy artykuł na blogu: 'Jak efektywnie budować masę'.", time: "Wczoraj", read: true, icon: Bell },
    ];

    const getIconColor = (type: string) => {
        if (type === 'success') return 'text-green-500';
        if (type === 'warning') return 'text-yellow-500';
        return 'text-blue-500';
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <Bell size={32} className="mr-3 text-yellow-500" />
                        Powiadomienia
                    </h1>
                    <p className="text-gray-500 mt-1">Wszystkie Twoje alerty i aktualizacje w jednym miejscu.</p>
                </header>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                    {notifications.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {notifications.map(notif => (
                                <li key={notif.id} className={`py-4 flex items-start space-x-4 ${!notif.read ? 'bg-blue-50/50 -mx-6 px-6' : ''}`}>
                                    <notif.icon size={24} className={`${getIconColor(notif.type)} flex-shrink-0 mt-1`} />
                                    <div className="flex-1">
                                        <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-700' : 'text-gray-600'}`}>{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                                    </div>
                                    {!notif.read && (
                                        <button className="text-xs text-blue-600 hover:underline">Oznacz jako przeczytane</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10">
                            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Brak nowych powiadomień.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default NotificationsPage;