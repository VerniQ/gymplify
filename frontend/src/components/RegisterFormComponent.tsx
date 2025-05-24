// src/components/RegisterFormComponent.tsx
import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { AuthService } from '../services/AuthService'; // Importuj AuthService

const RegisterFormComponent: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Hasła nie są identyczne');
            return;
        }
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {

            const data = await AuthService.register({ username, email, password });
            setSuccessMessage(data.message + " Przekierowywanie do logowania...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Wystąpił nieznany błąd podczas rejestracji.');
            }
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="p-8">
                <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
                    Zarejestruj się
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="sr-only">Nazwa użytkownika</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input id="username" name="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                   placeholder="Nazwa użytkownika" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="sr-only">Adres email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                   placeholder="Adres email" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Hasło</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                   placeholder="Hasło" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="sr-only">Potwierdź hasło</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                   placeholder="Potwierdź hasło" />
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    {successMessage && <div className="text-green-500 text-sm text-center">{successMessage}</div>}
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Masz już konto? Zaloguj się
                            </Link>
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50"
                        >
                            {isLoading ? 'Rejestrowanie...' : 'Zarejestruj się'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterFormComponent;