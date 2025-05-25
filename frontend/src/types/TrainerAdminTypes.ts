// src/types/TrainerAdminTypes.ts
export interface TrainerAdminView {
    trainerId: number;
    userId: number;
    name: string;
    surname: string;
    specialization: string;
    contact: string;
    username: string;
    email: string;
}

export interface TrainerProfileUpdatePayload {
    name: string;
    surname: string;
    specialization: string;
    contact: string;
}

export interface TrainerProfileCreationPayload {
    userId: number;
    name: string;
    surname: string;
    specialization: string;
    contact: string;
}