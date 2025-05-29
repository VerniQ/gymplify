
package me.verni.gymplify.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewUserStatDto {
    private String creationDate; // YYYY-MM-DD
    private Integer newUsersCount;
}