package me.verni.gymplify.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseCountByMuscleGroupDto {
    private String groupName;
    private Integer exerciseCount;
}