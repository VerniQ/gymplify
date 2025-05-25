import { API_BASE_URL } from '../config/generalConfig';
import { Exercise, ExercisePayload, ExerciseApiResponse } from '../types/ExerciseTypes';

const EXERCISES_API_ENDPOINT = `${API_BASE_URL}/api/admin/exercises`;


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
    let errorMessage = `${defaultMessage}. Status: ${response.status}`;
    console.error('API Error - Status:', response.status, 'StatusText:', response.statusText);
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error('API Error - JSON Body:', errorData);
            errorMessage = errorData.message || errorData.error || (typeof errorData === 'string' ? errorData : errorMessage);
        } else {
            const errorText = await response.text();
            console.error('API Error - Text Body:', errorText);
            if (errorText && errorText.trim() !== "") {
                errorMessage = errorText;
            }
        }
    } catch (e) {
        console.error("Error in handleApiError while processing response body:", e);
    }
    throw new Error(errorMessage);
};

const mapApiToExercise = (apiResponse: ExerciseApiResponse): Exercise => {
    return {
        exerciseId: apiResponse.exerciseId,
        name: apiResponse.name,
        description: apiResponse.description,
        groupId: apiResponse.groupId,
        groupName: apiResponse.groupName,
    };
};


export const ExerciseService = {
    getAllExercises: async (): Promise<Exercise[]> => {
        console.log(`Fetching all exercises from: ${EXERCISES_API_ENDPOINT}`);
        try {
            const response = await fetch(EXERCISES_API_ENDPOINT, {
                method: 'GET',
                headers: getAuthHeaders(false),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się pobrać ćwiczeń');
            }
            const data: ExerciseApiResponse[] = await response.json();
            return data.map(mapApiToExercise).filter(ex => ex.exerciseId != null);
        } catch (error) {
            console.error("Error in getAllExercises:", error);
            if (error instanceof Error) throw error;
            throw new Error('Wystąpił nieznany błąd podczas pobierania ćwiczeń.');
        }
    },

    getExerciseById: async (id: number): Promise<Exercise> => { // ID jako number
        console.log(`Fetching exercise by ID: ${id} from: ${EXERCISES_API_ENDPOINT}/${id}`);
        if (id == null) {
            const errMsg = "Nie można pobrać ćwiczenia: nieprawidłowe ID.";
            console.error(errMsg, "ID:", id);
            throw new Error(errMsg);
        }
        try {
            const response = await fetch(`${EXERCISES_API_ENDPOINT}/${id}`, {
                method: 'GET',
                headers: getAuthHeaders(false),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się pobrać szczegółów ćwiczenia');
            }
            const data: ExerciseApiResponse = await response.json();
            return mapApiToExercise(data);
        } catch (error) {
            console.error(`Error in getExerciseById (id: ${id}):`, error);
            if (error instanceof Error) throw error;
            throw new Error('Wystąpił nieznany błąd podczas pobierania szczegółów ćwiczenia.');
        }
    },

    findExercisesByMuscleGroupId: async (groupId: number): Promise<Exercise[]> => { // groupId jako number
        console.log(`Fetching exercises for muscle group ID: ${groupId} from: ${EXERCISES_API_ENDPOINT}/group/${groupId}`);
        if (groupId == null) {
            const errMsg = "Nie można pobrać ćwiczeń: nieprawidłowe ID grupy.";
            console.error(errMsg, "GroupID:", groupId);
            throw new Error(errMsg);
        }
        try {
            const response = await fetch(`${EXERCISES_API_ENDPOINT}/group/${groupId}`, {
                method: 'GET',
                headers: getAuthHeaders(false),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się pobrać ćwiczeń dla grupy mięśniowej');
            }
            const data: ExerciseApiResponse[] = await response.json();
            return data.map(mapApiToExercise).filter(ex => ex.exerciseId != null);
        } catch (error) {
            console.error(`Error in findExercisesByMuscleGroupId (groupId: ${groupId}):`, error);
            if (error instanceof Error) throw error;
            throw new Error('Wystąpił nieznany błąd podczas pobierania ćwiczeń dla grupy mięśniowej.');
        }
    },

    addExercise: async (payload: ExercisePayload): Promise<Exercise> => {
        console.log(`Adding exercise to: ${EXERCISES_API_ENDPOINT} with payload:`, payload);
        if (!payload.name) {
            throw new Error("Nazwa ćwiczenia jest wymagana.");
        }
        if (payload.groupId == null) {
            throw new Error("ID grupy mięśniowej jest wymagane.");
        }
        try {
            const response = await fetch(EXERCISES_API_ENDPOINT, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się dodać ćwiczenia');
            }
            const data: ExerciseApiResponse = await response.json();
            return mapApiToExercise(data);
        } catch (error) {
            console.error("Error in addExercise:", error);
            if (error instanceof Error) throw error;
            throw new Error('Wystąpił nieznany błąd podczas dodawania ćwiczenia.');
        }
    },

    updateExercise: async (id: number, payload: ExercisePayload): Promise<Exercise> => { // ID jako number
        console.log(`Updating exercise at: ${EXERCISES_API_ENDPOINT}/${id} with payload:`, payload);
        if (id == null) {
            const errMsg = "Nie można zaktualizować ćwiczenia: nieprawidłowe ID.";
            console.error(errMsg, "ID:", id);
            throw new Error(errMsg);
        }
        if (!payload.name) {
            throw new Error("Nazwa ćwiczenia jest wymagana przy aktualizacji.");
        }
        if (payload.groupId == null) { // Zakładając, że groupId jest wymagane
            throw new Error("ID grupy mięśniowej jest wymagane przy aktualizacji.");
        }
        try {
            const response = await fetch(`${EXERCISES_API_ENDPOINT}/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się zaktualizować ćwiczenia');
            }
            const data: ExerciseApiResponse = await response.json();
            return mapApiToExercise(data);
        } catch (error) {
            console.error("Error in updateExercise:", error);
            if (error instanceof Error) throw error;
            throw new Error('Wystąpił nieznany błąd podczas aktualizacji ćwiczenia.');
        }
    },

    deleteExercise: async (id: number): Promise<void> => { // ID jako number
        console.log(`Deleting exercise at: ${EXERCISES_API_ENDPOINT}/${id}`);
        if (id == null) {
            const errMsg = "Nie można usunąć ćwiczenia: nieprawidłowe ID.";
            console.error(errMsg, "ID:", id);
            throw new Error(errMsg);
        }
        try {
            const response = await fetch(`${EXERCISES_API_ENDPOINT}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(false),
            });
            if (!response.ok) {
                await handleApiError(response, 'Nie udało się usunąć ćwiczenia');
            }
        } catch (error) {
            console.error("Error in deleteExercise:", error);
            if (error instanceof Error) throw error;
            throw new Error('Wystąpił nieznany błąd podczas usuwania ćwiczenia.');
        }
    },
};