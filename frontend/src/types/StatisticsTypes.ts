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
    specialization?: string | null;
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
    creationDate: string;
    newUsersCount: number;
}

export interface SystemActivityCount {
    metric: string;
    countValue: number;
}

export interface PopularPlanDto {
    planName: string;
    assignmentsCount: number;
}

export interface ExerciseCountByMuscleGroupDto {
    groupName: string;
    exerciseCount: number;
}