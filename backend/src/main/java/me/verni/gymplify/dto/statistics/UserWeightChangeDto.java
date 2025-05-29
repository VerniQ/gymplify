
package me.verni.gymplify.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal; // Lub Double

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserWeightChangeDto {
    private Long userId;
    private BigDecimal initialWeight;
    private BigDecimal finalWeight;
    private BigDecimal averageChange;
    private Integer measurementCount;
    private boolean success;
    private String message;
}