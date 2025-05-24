import React from 'react';
import SidebarComponent from "../components/SidebarComponent";
import { Dumbbell, PlusCircle, ListFilter } from 'lucide-react';

const TrainingsPage: React.FC = () => {
    const trainings = [
        { id: 1, name: "Trening Siłowy Full Body", date: "2024-05-28", duration: "60 min" },
        { id: 2, name: "Cardio Interwałowe", date: "2024-05-26", duration: "45 min" },
        { id: 3, name: "Joga dla Początkujących", date: "2024-05-25", duration: "50 min" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarComponent />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                            <Dumbbell size={32} className="mr-3 text-blue-600" />
                            Moje Treningi
                        </h1>
                        <p className="text-gray-500 mt-1">Przeglądaj i zarządzaj swoimi planami treningowymi.</p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center">
                            <ListFilter size={16} className="mr-2" />
                            Filtruj
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center">
                            <PlusCircle size={16} className="mr-2" />
                            Dodaj Nowy Trening
                        </button>
                    </div>
                </header>

                <div className="space-y-4">
                    {trainings.length > 0 ? (
                        trainings.map(training => (
                            <div key={training.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200/80 flex justify-between items-center hover:shadow-lg transition-shadow">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-700">{training.name}</h3>
                                    <p className="text-sm text-gray-500">Data: {training.date} | Czas trwania: {training.duration}</p>
                                </div>
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    Zobacz szczegóły
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <Dumbbell size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Nie masz jeszcze zaplanowanych żadnych treningów.</p>
                            <button className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                Stwórz pierwszy trening
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TrainingsPage;