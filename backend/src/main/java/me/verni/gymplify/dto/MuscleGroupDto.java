package me.verni.gymplify.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MuscleGroupDto {
    private Long groupId;
    private String groupName;
    private String description;
}