import { API_BASE_URL } from '../config/generalConfig';
import { MuscleGroup, MuscleGroupPayload, MuscleGroupApiResponse } from '../types/MuscleGroupTypes';

// Zakładając, że API_BASE_URL to np. 'http://localhost:8090'
// Jeśli API_BASE_URL to 'http://localhost:8090/api', zmień na: `${API_BASE_URL}/admin/muscle-groups`
const MUSCLE_GROUPS_ENDPOINT = `${API_BASE_URL}/api/admin/muscle-groups`;

const mapApiToMuscleGroup = (apiResponse: MuscleGroupApiResponse): MuscleGroup => {
    return {
        id: String(apiResponse.group_id),
        name: apiResponse.group_name,
        description: apiResponse.description,
    };
};

const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
    let errorMessage = `${defaultMessage}. Status: ${response.status}`;
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
            const errorText = await response.text();
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
    // Dostosuj, jeśli token jest przechowywany inaczej (np. w Context API, Redux, Zustand)
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
    // console.log("Generated Headers:", headers); // Odkomentuj do debugowania
    return headers;
};

export const MuscleGroupService = {
    getAllMuscleGroups: async (): Promise<MuscleGroup[]> => {
        try {
            const response = await fetch(MUSCLE_GROUPS_ENDPOINT, {
                method: 'GET',
                headers: getAuthHeaders(false), // Content-Type nie jest zwykle potrzebny dla GET
            });
            if (!response.ok) {
                // handleApiError rzuca błąd, więc nie ma potrzeby 'return'
                await handleApiError(response, 'Nie udało się pobrać grup mięśniowych');
            }
            const data: MuscleGroupApiResponse[] = await response.json();
            return data.map(mapApiToMuscleGroup);
        } catch (error) {
            if (error instanceof Error) {
                throw error; // Przekaż błąd dalej (już opakowany)
            }
            throw new Error('Wystąpił nieznany błąd podczas pobierania grup mięśniowych.');
        }
    },

    addMuscleGroup: async (payload: MuscleGroupPayload): Promise<MuscleGroup> => {
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
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Wystąpił nieznany błąd podczas dodawania grupy mięśniowej.');
        }
    },

    updateMuscleGroup: async (id: string, payload: MuscleGroupPayload): Promise<MuscleGroup> => {
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
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Wystąpił nieznany błąd podczas aktualizacji grupy mięśniowej.');
        }
    },

    deleteMuscleGroup: async (id: string): Promise<void> => {
        try {
            const response = await fetch(`${MUSCLE_GROUPS_ENDPOINT}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(false), // Content-Type nie jest potrzebny dla DELETE bez ciała
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się usunąć grupy mięśniowej');
            }
            // Dla udanego DELETE nie ma ciała odpowiedzi do sparsowania
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Wystąpił nieznany błąd podczas usuwania grupy mięśniowej.');
        }
    },
};