// src/services/TrainingPlanService.ts
import { API_BASE_URL } from '../config/generalConfig';
import {
    TrainingPlan,
    CreateTrainingPlanPayload,
    UpdateTrainingPlanPayload,
    ExerciseInPlan
} from '../types/TrainingPlanTypes';
import { Exercise } from '../types/ExerciseTypes';

const TRAINING_PLANS_ENDPOINT = `${API_BASE_URL}/api/admin/training-plans`;

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
        } else {
            const errorText = await response.text();
            if (errorText) {
                errorMessage = `${defaultMessage}: ${errorText}`;
            }
        }
    } catch (e) {
        console.error('Error parsing error response:', e);
    }
    console.error('API Error:', errorMessage, 'Full Response:', response);
    throw new Error(errorMessage);
};

export const TrainingPlanService = {
    createTrainingPlan: async (payload: CreateTrainingPlanPayload): Promise<TrainingPlan> => {
        const response = await fetch(TRAINING_PLANS_ENDPOINT, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się utworzyć planu treningowego');
        }
        return response.json();
    },

    getAllTrainingPlans: async (): Promise<TrainingPlan[]> => {
        const response = await fetch(TRAINING_PLANS_ENDPOINT, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się pobrać planów treningowych');
        }
        return response.json();
    },

    getTrainingPlanById: async (planId: number): Promise<TrainingPlan> => {
        const response = await fetch(`${TRAINING_PLANS_ENDPOINT}/${planId}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać planu treningowego o ID ${planId}`);
        }
        return response.json();
    },

    updateTrainingPlan: async (planId: number, payload: UpdateTrainingPlanPayload): Promise<TrainingPlan> => {
        const response = await fetch(`${TRAINING_PLANS_ENDPOINT}/${planId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się zaktualizować planu treningowego o ID ${planId}`);
        }
        return response.json();
    },

    deleteTrainingPlan: async (planId: number): Promise<void> => {
        const response = await fetch(`${TRAINING_PLANS_ENDPOINT}/${planId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć planu treningowego o ID ${planId}`);
        }
    },

    addExerciseToPlan: async (planId: number, exerciseId: number): Promise<void> => {
        const response = await fetch(`${TRAINING_PLANS_ENDPOINT}/${planId}/exercises/${exerciseId}`, {
            method: 'POST',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się dodać ćwiczenia ID ${exerciseId} do planu ID ${planId}`);
        }
    },

    removeExerciseFromPlan: async (planId: number, exerciseId: number): Promise<void> => {
        const response = await fetch(`${TRAINING_PLANS_ENDPOINT}/${planId}/exercises/${exerciseId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć ćwiczenia ID ${exerciseId} z planu ID ${planId}`);
        }
    },

    removeAllExercisesFromPlan: async (planId: number): Promise<void> => {
        const response = await fetch(`${TRAINING_PLANS_ENDPOINT}/${planId}/exercises`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć wszystkich ćwiczeń z planu ID ${planId}`);
        }
    },

    getExercisesForPlan: async (planId: number): Promise<ExerciseInPlan[]> => {
        const response = await fetch(`${TRAINING_PLANS_ENDPOINT}/${planId}/exercises`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać ćwiczeń dla planu ID ${planId}`);
        }
        const data: Exercise[] = await response.json();
        return data;
    },
};