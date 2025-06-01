import { API_BASE_URL } from '../config/generalConfig';
import {
    RoleStat,
    SpecializationStat,
    TrainerWorkload,
    ExercisePopularity,
    NewUserStat,
    SystemActivityCount,
    PopularPlanDto,
    ExerciseCountByMuscleGroupDto
} from '../types/StatisticsTypes';

const STATISTICS_ENDPOINT = `${API_BASE_URL}/api/statistics`;

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
            errorMessage = errorData.message || errorData.error || (typeof errorData === 'string' ? errorData : errorMessage);
        } else {
            const errorText = await response.text();
            if (errorText && errorText.trim() !== "") errorMessage = `${defaultMessage}: ${errorText}`;
        }
    } catch (e) {
        console.error("API Statistics Error (parsing sub-error):", errorMessage, 'Parsing Error Details:', e);
    }
    console.error('API Statistics Error (final):', errorMessage, 'Full Response Status:', response.status);
    throw new Error(errorMessage);
};

export const StatisticsService = {
    getTotalUserCount: async (): Promise<number> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/users/total-count`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać całkowitej liczby użytkowników');
        const data = await response.json();
        if (typeof data !== 'number') {
            throw new Error('Nieprawidłowy format odpowiedzi dla całkowitej liczby użytkowników.');
        }
        return data;
    },

    getUserCountByRole: async (): Promise<RoleStat[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/users/by-role`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać liczby użytkowników po rolach');
        return response.json();
    },

    getNewUsersByPeriod: async (startDate: string, endDate: string): Promise<NewUserStat[]> => {
        const params = new URLSearchParams({ startDate, endDate });
        const response = await fetch(`${STATISTICS_ENDPOINT}/users/new-by-period?${params.toString()}`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać nowych użytkowników w okresie');
        return response.json();
    },

    getTotalTrainerCount: async (): Promise<number> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/trainers/total-count`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać całkowitej liczby trenerów');
        const data = await response.json();
        if (typeof data !== 'number') {
            throw new Error('Nieprawidłowy format odpowiedzi dla całkowitej liczby trenerów.');
        }
        return data;
    },

    getTrainerCountBySpecialization: async (): Promise<SpecializationStat[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/trainers/by-specialization`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać liczby trenerów po specjalizacjach');
        return response.json();
    },

    getTrainerWorkloadStats: async (): Promise<TrainerWorkload[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/trainers/workload`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać statystyk obciążenia trenerów');
        return response.json();
    },

    getExerciseCountByMuscleGroup: async (): Promise<ExerciseCountByMuscleGroupDto[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/exercises/count-by-muscle-group`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać liczby ćwiczeń wg grup');
        return response.json();
    },

    getMostPopularExercisesInPlans: async (topN: number = 10): Promise<ExercisePopularity[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/exercises/popular-in-plans?topN=${topN}`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać popularnych ćwiczeń w planach');
        return response.json();
    },

    getMostAssignedTrainingPlans: async (topN: number = 5): Promise<PopularPlanDto[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/training-plans/most-assigned?topN=${topN}`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać najczęściej przypisywanych planów');
        return response.json();
    },

    getOverallSystemActivityCounts: async (): Promise<SystemActivityCount[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/system/activity-counts`, { headers: getAuthHeaders(false) });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać ogólnych statystyk systemu');
        return response.json();
    },
};