
export interface MuscleGroup {
    id: string;
    name: string;
    description: string | null;
}

export interface MuscleGroupPayload {
    group_name: string;
    description: string | null;
}

export interface MuscleGroupApiResponse {
    group_id: number;
    group_name: string;
    description: string | null;
}