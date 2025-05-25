package me.verni.gymplify.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseDto {
    private Long exerciseId;
    private String name;
    private String description;
    private Long groupId;
    private String groupName;
}