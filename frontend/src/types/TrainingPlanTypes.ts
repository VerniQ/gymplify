// src/types/TrainingPlanTypes.ts
import { Exercise } from './ExerciseTypes';

export interface TrainingPlan {
    planId: number;
    name: string;
}

export interface CreateTrainingPlanPayload {
    name: string;
}

export interface UpdateTrainingPlanPayload {
    name: string;
}

export type ExerciseInPlan = Exercise;