package me.verni.gymplify.util;

import me.verni.gymplify.dto.TrainerAdminViewDto;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class TrainerAdminViewRowMapper implements RowMapper<TrainerAdminViewDto> {
    @Override
    public TrainerAdminViewDto mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new TrainerAdminViewDto(
                rs.getLong("trainer_id"),
                rs.getLong("user_id"),
                rs.getString("name"),
                rs.getString("surname"),
                rs.getString("specialization"),
                rs.getString("contact"),
                rs.getString("username"),
                rs.getString("email")
        );
    }
}