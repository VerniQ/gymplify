export interface RegistrationPayload {
    username?: string;
    email?: string;
    password?: string;
}

export interface LoginPayload {
    email?: string;
    password?: string;
}

export interface UserData {
    userId: number;
    email: string;
    username: string;
    role: string;
}

export interface AuthResponse {
    message: string;
    token?: string;
    user?: UserData;
    error?: string;
}
