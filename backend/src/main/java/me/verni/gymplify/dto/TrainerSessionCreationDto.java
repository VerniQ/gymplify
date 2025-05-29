package me.verni.gymplify.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class TrainerSessionCreationDto {
    @NotNull(message = "ID trenera jest wymagane.")
    private Long trainerId;

    @NotNull(message = "Data sesji jest wymagana.")
    @FutureOrPresent(message = "Data sesji nie może być z przeszłości.")
    private LocalDate sessionDate;

    @NotNull(message = "Czas rozpoczęcia jest wymagany.")
    private LocalTime startTime;

    @NotNull(message = "Czas zakończenia jest wymagany.")
    private LocalTime endTime;
}