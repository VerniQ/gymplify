export interface MuscleGroup {
    id: string;
    name: string;
    description: string | null;
}

export interface MuscleGroupPayload {
    groupName: string;
    description: string | null;
}

export interface MuscleGroupApiResponse {
    groupId: number;
    groupName: string;
    description: string | null;
}