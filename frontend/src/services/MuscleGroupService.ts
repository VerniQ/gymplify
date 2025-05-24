import { API_BASE_URL } from '../config/generalConfig';
import { MuscleGroup, MuscleGroupPayload, MuscleGroupApiResponse } from '../types/MuscleGroupTypes';

const MUSCLE_GROUPS_ENDPOINT = `${API_BASE_URL}/api/admin/muscle-groups`;

const mapApiToMuscleGroup = (apiResponse: MuscleGroupApiResponse): MuscleGroup => {
    return {
        id: String(apiResponse.groupId),
        name: apiResponse.groupName,
        description: apiResponse.description,
    };
};

const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
    let errorMessage = `${defaultMessage}. Status: ${response.status}`;
    console.error('API Error - Status:', response.status, 'StatusText:', response.statusText);
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error('API Error - JSON Body:', errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
            const errorText = await response.text();
            console.error('API Error - Text Body:', errorText);
            if (errorText) {
                errorMessage = errorText;
            }
        }
    } catch (e) {
        console.error("Error in handleApiError while processing response body:", e);
    }
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

export const MuscleGroupService = {
    getAllMuscleGroups: async (): Promise<MuscleGroup[]> => {
        console.log(`Fetching all muscle groups from: ${MUSCLE_GROUPS_ENDPOINT}`);
        try {
            const response = await fetch(MUSCLE_GROUPS_ENDPOINT, {
                method: 'GET',
                headers: getAuthHeaders(false),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się pobrać grup mięśniowych');
            }
            const data: MuscleGroupApiResponse[] = await response.json();
            return data.map(mapApiToMuscleGroup).filter(group => group.id && group.id !== "undefined" && group.id !== "null");
        } catch (error) {
            console.error("Error in getAllMuscleGroups:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Wystąpił nieznany błąd podczas pobierania grup mięśniowych.');
        }
    },

    addMuscleGroup: async (payload: MuscleGroupPayload): Promise<MuscleGroup> => {
        console.log(`Adding muscle group to: ${MUSCLE_GROUPS_ENDPOINT} with payload:`, payload);
        try {
            const response = await fetch(MUSCLE_GROUPS_ENDPOINT, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się dodać grupy mięśniowej');
            }
            const data: MuscleGroupApiResponse = await response.json();
            return mapApiToMuscleGroup(data);
        } catch (error) {
            console.error("Error in addMuscleGroup:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Wystąpił nieznany błąd podczas dodawania grupy mięśniowej.');
        }
    },

    updateMuscleGroup: async (id: string, payload: MuscleGroupPayload): Promise<MuscleGroup> => {
        console.log(`Updating muscle group at: ${MUSCLE_GROUPS_ENDPOINT}/${id} with payload:`, payload);
        if (!id || id === "undefined" || id === "null") {
            const errMsg = "Nie można zaktualizować grupy: nieprawidłowe lub brakujące ID.";
            console.error(errMsg, "ID:", id);
            throw new Error(errMsg);
        }
        try {
            const response = await fetch(`${MUSCLE_GROUPS_ENDPOINT}/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się zaktualizować grupy mięśniowej');
            }
            const data: MuscleGroupApiResponse = await response.json();
            return mapApiToMuscleGroup(data);
        } catch (error) {
            console.error("Error in updateMuscleGroup:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Wystąpił nieznany błąd podczas aktualizacji grupy mięśniowej.');
        }
    },

    deleteMuscleGroup: async (id: string): Promise<void> => {
        console.log(`Deleting muscle group at: ${MUSCLE_GROUPS_ENDPOINT}/${id}`);
        if (!id || id === "undefined" || id === "null") {
            const errMsg = "Nie można usunąć grupy: nieprawidłowe lub brakujące ID.";
            console.error(errMsg, "ID:", id);
            throw new Error(errMsg);
        }
        try {
            const response = await fetch(`${MUSCLE_GROUPS_ENDPOINT}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(false),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się usunąć grupy mięśniowej');
            }
        } catch (error) {
            console.error("Error in deleteMuscleGroup:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Wystąpił nieznany błąd podczas usuwania grupy mięśniowej.');
        }
    },
};