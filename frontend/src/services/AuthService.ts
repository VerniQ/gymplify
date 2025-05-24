// src/services/AuthService.ts
import { RegistrationPayload, LoginPayload, AuthResponse } from '../types/AuthTypes';
import { API_BASE_URL } from '../config/generalConfig.ts';

export const AuthService = {
    register: async (payload: RegistrationPayload): Promise<AuthResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data: AuthResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Rejestracja nie powiodła się.');
            }
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message || 'Wystąpił błąd podczas rejestracji.');
            }
            throw new Error('Wystąpił nieznany błąd podczas rejestracji.');
        }
    },

    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data: AuthResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Logowanie nie powiodło się.');
            }
            if (!data.token || !data.user) {
                throw new Error('Odpowiedź serwera nie zawiera tokenu lub danych użytkownika.');
            }
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message || 'Wystąpił błąd podczas logowania.');
            }
            throw new Error('Wystąpił nieznany błąd podczas logowania.');
        }
    },

};