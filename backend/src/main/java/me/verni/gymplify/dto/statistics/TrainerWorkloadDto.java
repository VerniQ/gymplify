
package me.verni.gymplify.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainerWorkloadDto {
    private Long trainerId;
    private String trainerFullName;
    private String specialization;
    private Integer assignedClientsCount;
    private Integer totalScheduledSessions;
    private Integer sessionsNext7Days;
}
