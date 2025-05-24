// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserData {
    userId: number;
    email: string;
    username: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: UserData | null;
    login: (token: string, userData: UserData) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(localStorage.getItem('jwtToken'));
    const [user, setUser] = useState<UserData | null>(() => {
        const storedUser = localStorage.getItem('userData');
        try {
            return storedUser ? JSON.parse(storedUser) as UserData : null;
        } catch (error) {
            console.error("Failed to parse user data from localStorage", error);
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('jwtToken');
        if (storedToken && user) {
            setToken(storedToken);
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, [user]);

    const login = (newToken: string, userData: UserData) => { // Typujemy userData
        localStorage.setItem('jwtToken', newToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        navigate('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userData');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, user, login, logout, isLoading }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};