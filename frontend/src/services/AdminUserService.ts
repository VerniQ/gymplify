// src/services/AdminUserService.ts
import { API_BASE_URL } from '../config/generalConfig';
import {
    UserAdminView,
    UserCreationAdminPayload,
    UserRoleUpdatePayload
} from '../types/UserAdminTypes';

const ADMIN_USERS_ENDPOINT = `${API_BASE_URL}/api/admin/users`;

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

export const AdminUserService = {
    getAllUsers: async (): Promise<UserAdminView[]> => {
        const response = await fetch(ADMIN_USERS_ENDPOINT, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się pobrać listy użytkowników');
        }
        return response.json();
    },

    getUserById: async (userId: number): Promise<UserAdminView> => {
        const response = await fetch(`${ADMIN_USERS_ENDPOINT}/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się pobrać użytkownika o ID ${userId}`);
        }
        return response.json();
    },

    createUserByAdmin: async (payload: UserCreationAdminPayload): Promise<UserAdminView> => {
        const response = await fetch(ADMIN_USERS_ENDPOINT, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, 'Nie udało się utworzyć użytkownika');
        }
        return response.json();
    },

    updateUserRole: async (userId: number, payload: UserRoleUpdatePayload): Promise<UserAdminView> => {
        const response = await fetch(`${ADMIN_USERS_ENDPOINT}/${userId}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się zaktualizować roli użytkownika o ID ${userId}`);
        }
        return response.json();
    },

    deleteUser: async (userId: number): Promise<void> => {
        const response = await fetch(`${ADMIN_USERS_ENDPOINT}/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false),
        });
        if (!response.ok) {
            await handleApiError(response, `Nie udało się usunąć użytkownika o ID ${userId}`);
        }
    },
};