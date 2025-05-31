package me.verni.gymplify.util;

import me.verni.gymplify.dto.TrainerSessionDto;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TrainerSessionRowMapper implements RowMapper<TrainerSessionDto> {

    @Override
    public TrainerSessionDto mapRow(ResultSet rs, int rowNum) throws SQLException {
        Long scheduleId = rs.getLong("SCHEDULE_ID");
        Long trainerId = rs.getLong("TRAINER_ID");
        String trainerName = rs.getString("TRAINER_NAME");
        String trainerSurname = rs.getString("TRAINER_SURNAME");

        LocalDate sessionDate = null;
        Timestamp sessionDateTs = rs.getTimestamp("SESSION_DATE");
        if (sessionDateTs != null) {
            sessionDate = sessionDateTs.toLocalDateTime().toLocalDate();
        }

        LocalDateTime startTime = null;
        Timestamp startTimeTs = rs.getTimestamp("START_TIME");
        if (startTimeTs != null) {
            startTime = startTimeTs.toLocalDateTime();
        }

        LocalDateTime endTime = null;
        Timestamp endTimeTs = rs.getTimestamp("END_TIME");
        if (endTimeTs != null) {
            endTime = endTimeTs.toLocalDateTime();
        }

        return new TrainerSessionDto(
                scheduleId,
                trainerId,
                trainerName,
                trainerSurname,
                sessionDate,
                startTime,
                endTime
        );
    }
}