
package me.verni.gymplify.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardRankingDto {
    private String username;
    private String exerciseName;
    private BigDecimal weight;
    private LocalDate measurementDate;
    private Integer exerciseRank;
}