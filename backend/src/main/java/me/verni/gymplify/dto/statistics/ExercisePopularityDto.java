package me.verni.gymplify.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExercisePopularityDto {
    private String exerciseName;
    private String muscleGroup;
    private Integer countValue;
}