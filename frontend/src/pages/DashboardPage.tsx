import React from 'react';
import SidebarComponent from "../components/SidebarComponent";
import { useAuth } from '../context/AuthContext';
import {TrendingUp, Zap, Activity, Award, CalendarCheck2, Dumbbell} from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 hover:shadow-xl transition-shadow duration-300`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );
};

const ActivityItem: React.FC<{ text: string; time: string; icon: React.ElementType }> = ({ text, time, icon: Icon }) => {
    return (
        <li className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0">
            <div className="bg-gray-100 p-2 rounded-full">
                <Icon size={18} className="text-gray-500" />
            </div>
            <div>
                <p className="text-sm text-gray-700">{text}</p>
                <p className="text-xs text-gray-400">{time}</p>
            </div>
        </li>
    );
};


const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarComponent />

            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">
                        Witaj{user?.username ? `, ${user.username}` : ''}!
                    </h1>
                    <p className="text-gray-500 mt-1">Oto przegląd Twojej aktywności i postępów.</p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Aktywne Treningi" value="3" icon={Zap} color="blue" />
                    <StatCard title="Całkowity Postęp" value="+15%" icon={TrendingUp} color="green" />
                    <StatCard title="Punkty Lojalnościowe" value="1250" icon={Award} color="yellow" />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">Ostatnie Aktywności</h2>
                        <ul>
                            <ActivityItem text="Zakończono trening 'Siła Całego Ciała'" time="2 godziny temu" icon={Activity} />
                            <ActivityItem text="Nowy rekord w podnoszeniu ciężarów!" time="Wczoraj" icon={Dumbbell} />
                            <ActivityItem text="Zaplanowano trening 'Cardio Boost'" time="3 dni temu" icon={CalendarCheck2} />
                            <ActivityItem text="Osiągnięto nowy poziom: 'Żelazny Weteran'" time="Tydzień temu" icon={Award} />
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">Znajomi Online</h2>
                        <div className="space-y-3">
                            {['Adam Nowak', 'Ewa Kowalska', 'Piotr Zając'].map(name => (
                                <div key={name} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                                    <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                                        {name.substring(0,1)}
                                    </div>
                                    <span className="text-sm text-gray-700">{name}</span>
                                    <span className="ml-auto w-2.5 h-2.5 bg-green-500 rounded-full" title="Online"></span>
                                </div>
                            ))}
                            <p className="text-xs text-center text-gray-400 pt-2">... i 5 innych</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;