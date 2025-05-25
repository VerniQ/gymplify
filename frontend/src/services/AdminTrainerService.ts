// src/services/AdminTrainerService.ts
import { API_BASE_URL } from '../config/generalConfig';
import { TrainerAdminView, TrainerProfileUpdatePayload, TrainerProfileCreationPayload } from '../types/TrainerAdminTypes';

const ADMIN_TRAINER_PROFILES_ENDPOINT = `${API_BASE_URL}/api/admin/trainer-profiles`;

const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
    let errorMessage = `${defaultMessage}. Status: ${response.status} ${response.statusText}`;
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
            const errorText = await response.text();
            if (errorText) {
                errorMessage = `${defaultMessage}: ${errorText}`;
            }
        }
    } catch (e) {
    }
    console.error('API Error:', errorMessage, 'Full Response:', response);
    throw new Error(errorMessage);
};

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

export const AdminTrainerService = {
    createTrainerProfile: async (payload: TrainerProfileCreationPayload): Promise<TrainerAdminView> => {
        const response = await fetch(ADMIN_TRAINER_PROFILES_ENDPOINT, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się utworzyć profilu trenera');
        }
        return response.json();
    },

    getAllTrainerProfiles: async (): Promise<TrainerAdminView[]> => {
        const response = await fetch(ADMIN_TRAINER_PROFILES_ENDPOINT, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się pobrać profili trenerów');
        }
        return response.json();
    },

    getTrainerProfileById: async (trainerId: number): Promise<TrainerAdminView> => {
        const response = await fetch(`${ADMIN_TRAINER_PROFILES_ENDPOINT}/${trainerId}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać profilu trenera o ID ${trainerId}`);
        }
        return response.json();
    },

    updateTrainerProfile: async (trainerId: number, payload: TrainerProfileUpdatePayload): Promise<TrainerAdminView> => {
        const response = await fetch(`${ADMIN_TRAINER_PROFILES_ENDPOINT}/${trainerId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się zaktualizować profilu trenera o ID ${trainerId}`);
        }
        return response.json();
    },

    deleteTrainerProfile: async (trainerId: number): Promise<void> => {
        const response = await fetch(`${ADMIN_TRAINER_PROFILES_ENDPOINT}/${trainerId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć profilu trenera o ID ${trainerId}`);
        }
    },
};