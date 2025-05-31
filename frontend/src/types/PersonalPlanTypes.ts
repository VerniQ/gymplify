export interface PersonalPlanDto {
    personalPlanId: number;
    userId: number;
    username: string;
    trainerId: number;
    trainerName: string;
    trainerSurname: string;
    planId: number;
    planName: string;
}

export interface PersonalPlanCreationPayload {
    userId: number;
    trainerId: number;
    planId: number;
}

export interface PersonalPlanUpdatePayload {
    newTrainerId: number;
    newPlanId: number;
}

export interface UserInPersonalPlanDto {
    personalPlanId: number;
    userId: number;
    username: string;
    email: string;
    trainerId: number;
    trainerName: string;
    trainerSurname: string;
}

export interface UserSelectionDto {
    userId: number;
    username: string;
    email: string;
}

export interface TrainerSelectionDto {
    trainerId: number;
    name: string;
    surname: string;
}

export interface TrainingPlanSelectionDto {
    planId: number;
    name: string;
}