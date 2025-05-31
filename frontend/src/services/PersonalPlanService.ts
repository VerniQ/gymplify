import { API_BASE_URL } from '../config/generalConfig';
import {
    PersonalPlanDto,
    PersonalPlanCreationPayload,
    PersonalPlanUpdatePayload,
    UserInPersonalPlanDto
} from '../types/PersonalPlanTypes';

const PERSONAL_PLANS_ENDPOINT = `${API_BASE_URL}/api/personal-plans`;

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
        errorMessage = `${defaultMessage}: Błąd parsowania odpowiedzi serwera`;
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

export const PersonalPlanService = {
    assignPlanToUser: async (payload: PersonalPlanCreationPayload): Promise<PersonalPlanDto> => {
        const response = await fetch(PERSONAL_PLANS_ENDPOINT, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się przypisać planu do użytkownika');
        }
        return response.json();
    },

    unassignPersonalPlanById: async (personalPlanId: number): Promise<void> => {
        const response = await fetch(`${PERSONAL_PLANS_ENDPOINT}/${personalPlanId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć przypisania o ID ${personalPlanId}`);
        }
    },

    unassignPlanFromUser: async (userId: number, planId: number, trainerId?: number): Promise<void> => {
        let url = `${PERSONAL_PLANS_ENDPOINT}/user/${userId}/plan/${planId}`;
        if (trainerId) {
            url += `?trainerId=${trainerId}`;
        }
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć przypisania planu dla użytkownika`);
        }
    },

    updatePersonalPlanAssignment: async (personalPlanId: number, payload: PersonalPlanUpdatePayload): Promise<PersonalPlanDto> => {
        const response = await fetch(`${PERSONAL_PLANS_ENDPOINT}/${personalPlanId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się zaktualizować przypisania o ID ${personalPlanId}`);
        }
        return response.json();
    },

    getPersonalPlanById: async (personalPlanId: number): Promise<PersonalPlanDto> => {
        const response = await fetch(`${PERSONAL_PLANS_ENDPOINT}/${personalPlanId}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać przypisania o ID ${personalPlanId}`);
        }
        return response.json();
    },

    getPersonalPlansForUser: async (userId: number): Promise<PersonalPlanDto[]> => {
        const response = await fetch(`${PERSONAL_PLANS_ENDPOINT}/user/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać planów dla użytkownika o ID ${userId}`);
        }
        return response.json();
    },

    getUsersForPersonalPlanByPlanId: async (planId: number): Promise<UserInPersonalPlanDto[]> => {
        const response = await fetch(`${PERSONAL_PLANS_ENDPOINT}/plan/${planId}/users`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać użytkowników dla planu o ID ${planId}`);
        }
        return response.json();
    },

    listAllPersonalPlans: async (): Promise<PersonalPlanDto[]> => {
        const response = await fetch(PERSONAL_PLANS_ENDPOINT, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się pobrać wszystkich przypisanych planów');
        }
        return response.json();
    },
};