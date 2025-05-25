// src/types/UserAdminTypes.ts
export type RoleType = 'USER' | 'TRAINER' | 'ADMIN';

export interface UserAdminView {
    userId: number;
    username: string;
    email: string;
    role: RoleType;
}

export interface UserCreationAdminPayload {
    username: string;
    email: string;
    password?: string;
    role: RoleType;
}

export interface UserRoleUpdatePayload {
    role: RoleType;
}

export interface UserFormModalData {
    username: string;
    email: string;
    password?: string;
    role: RoleType;
}