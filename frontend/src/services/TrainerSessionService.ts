// src/services/TrainerSessionService.ts
import { API_BASE_URL } from '../config/generalConfig';
import {
    TrainerSession,
    CreateTrainerSessionPayload,
    UpdateTrainerSessionPayload
} from '../types/TrainerSessionTypes';

const TRAINER_SESSIONS_ENDPOINT = `${API_BASE_URL}/api/admin/trainer-sessions`;

const getAuthToken = (): string | null => {
    return localStorage.getItem('jwtToken');
};

const getAuthHeaders = (includeContentType: boolean = true): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
    let errorMessage = `${defaultMessage}. Status: ${response.status} ${response.statusText}`;
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            if (errorData.fieldErrors) {
                const fieldErrorMessages = Object.entries(errorData.fieldErrors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join(', ');
                errorMessage += ` Szczegóły: ${fieldErrorMessages}`;
            }
        } else {
            const errorText = await response.text();
            if (errorText) {
                errorMessage = `${defaultMessage}: ${errorText}`;
            }
        }
    } catch (e) {
        console.error('Error parsing error response:', e);
        errorMessage = `${defaultMessage}. Nie udało się przetworzyć odpowiedzi błędu.`;
    }
    console.error('API Error:', errorMessage, 'Full Response:', response);
    throw new Error(errorMessage);
};

export const TrainerSessionService = {
    createTrainerSession: async (payload: CreateTrainerSessionPayload): Promise<TrainerSession> => {
        const response = await fetch(TRAINER_SESSIONS_ENDPOINT, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się utworzyć sesji trenera');
        }
        return response.json();
    },

    getAllTrainerSessions: async (fromDate?: string, toDate?: string): Promise<TrainerSession[]> => {
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);

        const response = await fetch(`${TRAINER_SESSIONS_ENDPOINT}?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się pobrać sesji trenerów');
        }
        return response.json();
    },

    getTrainerSessionsByTrainer: async (trainerId: number, fromDate?: string, toDate?: string): Promise<TrainerSession[]> => {
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);

        const response = await fetch(`${TRAINER_SESSIONS_ENDPOINT}/trainer/${trainerId}?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać sesji dla trenera ID ${trainerId}`);
        }
        return response.json();
    },

    getTrainerSessionById: async (sessionId: number): Promise<TrainerSession> => {
        const response = await fetch(`${TRAINER_SESSIONS_ENDPOINT}/${sessionId}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać sesji trenera o ID ${sessionId}`);
        }
        return response.json();
    },

    updateTrainerSession: async (sessionId: number, payload: UpdateTrainerSessionPayload): Promise<TrainerSession> => {
        const response = await fetch(`${TRAINER_SESSIONS_ENDPOINT}/${sessionId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się zaktualizować sesji trenera o ID ${sessionId}`);
        }
        return response.json();
    },

    deleteTrainerSession: async (sessionId: number): Promise<void> => {
        const response = await fetch(`${TRAINER_SESSIONS_ENDPOINT}/${sessionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć sesji trenera o ID ${sessionId}`);
        }
    },
};