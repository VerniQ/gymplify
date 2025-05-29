
package me.verni.gymplify.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpecializationStatDto {
    private String specialization;
    private Integer trainerCount;
}