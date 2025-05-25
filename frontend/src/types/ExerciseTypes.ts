export interface MuscleGroupSelection {
    id: number;
    name: string;
}

export interface Exercise {
    exerciseId: number;
    name: string;
    description: string | null;
    groupId: number | null;
    groupName?: string;
}

export interface ExercisePayload {
    name: string;
    description: string | null;
    groupId: number | null;
}


export interface ExerciseApiResponse {
    exerciseId: number;
    name: string;
    description: string | null;
    groupId: number | null;
    groupName?: string;
}