import React from 'react';
import SidebarComponent from "../components/SidebarComponent";
import { Heart, ExternalLink } from 'lucide-react';

const FavoritesPage: React.FC = () => {
    const favoriteItems = [
        { id: 1, type: 'Trening', name: "Szybkie Cardio na Spalanie", link: "/trainings/123" },
        { id: 2, type: 'Ćwiczenie', name: "Wyciskanie sztangi na ławce", link: "/exercises/45" },
        { id: 3, type: 'Artykuł', name: "10 mitów na temat diety", link: "/blog/10-myths" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <Heart size={32} className="mr-3 text-red-500" />
                        Ulubione
                    </h1>
                    <p className="text-gray-500 mt-1">Twoje zapisane treningi, ćwiczenia i artykuły.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteItems.length > 0 ? (
                        favoriteItems.map(item => (
                            <div key={item.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-200/80 hover:shadow-lg transition-shadow">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block ${
                                    item.type === 'Trening' ? 'bg-blue-100 text-blue-700' :
                                        item.type === 'Ćwiczenie' ? 'bg-green-100 text-green-700' :
                                            'bg-purple-100 text-purple-700'
                                }`}>
                                    {item.type}
                                </span>
                                <h3 className="text-lg font-semibold text-slate-700 mb-1">{item.name}</h3>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center">
                                    Przejdź <ExternalLink size={14} className="ml-1" />
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Nie dodałeś jeszcze nic do ulubionych.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FavoritesPage;