import { API_BASE_URL } from '../config/generalConfig';
import {
    RoleStat,
    SpecializationStat,
    TrainerWorkload,
    ExercisePopularity,
    NewUserStat,
    SystemActivityCount,
    UserWeightChange,
    LeaderboardRanking
} from '../types/StatisticsTypes';

const STATISTICS_ENDPOINT = `${API_BASE_URL}/api/statistics`;

const getAuthToken = (): string | null => {
    return localStorage.getItem('jwtToken');
};

const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
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
            if (errorText) errorMessage = `${defaultMessage}: ${errorText}`;
        }
        console.error('API Statistics Error:', errorMessage, 'Full Response:', response);
        throw new Error(errorMessage);

    } catch (e: unknown) {
        console.error('API Statistics Error (parsing sub-error):', errorMessage, 'Parsing Error Details:', e, 'Full Response:', response);
        throw new Error(errorMessage);
    }
};


export const StatisticsService = {
    getTotalUserCount: async (): Promise<number> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/users/total-count`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać całkowitej liczby użytkowników');
        return response.json();
    },

    getUserCountByRole: async (): Promise<RoleStat[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/users/by-role`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać liczby użytkowników po rolach');
        return response.json();
    },

    getNewUsersByPeriod: async (startDate: string, endDate: string): Promise<NewUserStat[]> => {
        const params = new URLSearchParams({ startDate, endDate });
        const response = await fetch(`${STATISTICS_ENDPOINT}/users/new-by-period?${params.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać nowych użytkowników w okresie');
        return response.json();
    },

    getUserAverageWeightChange: async (userId: number, startDate: string, endDate: string): Promise<UserWeightChange> => {
        const params = new URLSearchParams({ startDate, endDate });
        const response = await fetch(`${STATISTICS_ENDPOINT}/users/${userId}/weight-change?${params.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, `Nie udało się pobrać zmiany wagi dla użytkownika ID ${userId}`);
        return response.json();
    },

    getTotalTrainerCount: async (): Promise<number> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/trainers/total-count`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać całkowitej liczby trenerów');
        return response.json();
    },

    getTrainerCountBySpecialization: async (): Promise<SpecializationStat[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/trainers/by-specialization`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać liczby trenerów po specjalizacjach');
        return response.json();
    },

    getTrainerWorkloadStats: async (): Promise<TrainerWorkload[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/trainers/workload`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać statystyk obciążenia trenerów');
        return response.json();
    },

    getMostPopularExercisesInPlans: async (topN: number = 10): Promise<ExercisePopularity[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/exercises/popular-in-plans?topN=${topN}`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać popularnych ćwiczeń w planach');
        return response.json();
    },

    getMostPopularExercisesInLeaderboard: async (topN: number = 10): Promise<ExercisePopularity[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/exercises/popular-in-leaderboard?topN=${topN}`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać popularnych ćwiczeń w leaderboardach');
        return response.json();
    },

    getLeaderboardRankingsForExercise: async (exerciseId: number, topN: number = 10): Promise<LeaderboardRanking[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/leaderboard/rankings/exercise/${exerciseId}?topN=${topN}`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, `Nie udało się pobrać rankingów dla ćwiczenia ID ${exerciseId}`);
        return response.json();
    },

    getOverallSystemActivityCounts: async (): Promise<SystemActivityCount[]> => {
        const response = await fetch(`${STATISTICS_ENDPOINT}/system/activity-counts`, { headers: getAuthHeaders() });
        if (!response.ok) await handleApiError(response, 'Nie udało się pobrać ogólnych statystyk systemu');
        return response.json();
    },
};