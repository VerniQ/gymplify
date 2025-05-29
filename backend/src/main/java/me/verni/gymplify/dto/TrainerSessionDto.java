package me.verni.gymplify.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainerSessionDto {
    private Long scheduleId;
    private Long trainerId;
    private String trainerName;
    private String trainerSurname;
    private LocalDate sessionDate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}