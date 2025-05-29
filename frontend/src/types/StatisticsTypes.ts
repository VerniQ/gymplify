// src/types/StatisticsTypes.ts

export interface RoleStat {
    roleName: string;
    userCount: number;
}

export interface SpecializationStat {
    specialization: string;
    trainerCount: number;
}

export interface TrainerWorkload {
    trainerId: number;
    trainerFullName: string;
    specialization?: string;
    assignedClientsCount: number;
    totalScheduledSessions: number;
    sessionsNext7Days: number;
}

export interface ExercisePopularity {
    exerciseName: string;
    muscleGroup: string;
    countValue: number;
}

export interface NewUserStat {
    creationDate: string; // YYYY-MM-DD
    newUsersCount: number;
}

export interface SystemActivityCount {
    metric: string;
    count: number;
}

export interface UserWeightChange {
    userId: number;
    initialWeight?: number;
    finalWeight?: number;
    averageChange?: number;
    measurementCount: number;
    success: boolean;
    message?: string;
}

export interface LeaderboardRanking {
    username: string;
    exerciseName: string;
    weight: number;
    measurementDate: string;
    exerciseRank: number;
}