// src/types/TrainerSessionTypes.ts
export interface TrainerSession {
    scheduleId: number;
    trainerId: number;
    trainerName: string;
    trainerSurname: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
}

export interface CreateTrainerSessionPayload {
    trainerId: number;
    sessionDate: string;
    startTime: string;
    endTime: string;
}

export interface UpdateTrainerSessionPayload {
    trainerId: number;
    sessionDate: string;
    startTime: string;
    endTime: string;
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    trainerId: number;
    trainerName?: string;
    trainerSurname?: string;
}