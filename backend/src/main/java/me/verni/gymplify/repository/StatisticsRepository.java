package me.verni.gymplify.repository;

import me.verni.gymplify.dto.statistics.*;
import me.verni.gymplify.exception.OperationFailedException;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class StatisticsRepository {

    private static final Logger log = LoggerFactory.getLogger(StatisticsRepository.class);
    private final JdbcTemplate jdbcTemplate;

    private final SimpleJdbcCall getTotalUserCountCall;
    private final SimpleJdbcCall getUserCountByRoleTypedCall;
    private final SimpleJdbcCall getNewUsersByPeriodCall;
    private final SimpleJdbcCall getTotalTrainerCountCall;
    private final SimpleJdbcCall getTrainerCountBySpecializationTypedCall;
    private final SimpleJdbcCall getTrainerWorkloadStatsTypedCall;
    private final SimpleJdbcCall getMostPopularExercisesInPlansTypedCall;
    private final SimpleJdbcCall getMostPopularExercisesInLeaderboardTypedCall;
    private final SimpleJdbcCall getLeaderboardRankingsForExerciseCall;
    private final SimpleJdbcCall getOverallSystemActivityCountsCall;


    private static class RoleStatDtoRowMapper implements RowMapper<RoleStatDto> {
        @Override
        public RoleStatDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new RoleStatDto(rs.getString("ROLE_NAME"), rs.getInt("USER_COUNT"));
        }
    }

    private static class SpecializationStatDtoRowMapper implements RowMapper<SpecializationStatDto> {
        @Override
        public SpecializationStatDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new SpecializationStatDto(rs.getString("SPECIALIZATION_NAME"), rs.getInt("TRAINER_COUNT"));
        }
    }

    private static class TrainerWorkloadDtoRowMapper implements RowMapper<TrainerWorkloadDto> {
        @Override
        public TrainerWorkloadDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new TrainerWorkloadDto(
                    rs.getLong("TRAINER_ID"),
                    rs.getString("TRAINER_FULL_NAME"),
                    rs.getString("SPECIALIZATION"),
                    rs.getInt("ASSIGNED_CLIENTS_COUNT"),
                    rs.getInt("TOTAL_SCHEDULED_SESSIONS"),
                    rs.getInt("SESSIONS_NEXT_7_DAYS")
            );
        }
    }

    private static class ExercisePopularityDtoRowMapper implements RowMapper<ExercisePopularityDto> {
        @Override
        public ExercisePopularityDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new ExercisePopularityDto(
                    rs.getString("EXERCISE_NAME"),
                    rs.getString("MUSCLE_GROUP"),
                    rs.getInt("COUNT_VALUE")
            );
        }
    }

    private static class NewUserStatDtoRowMapper implements RowMapper<NewUserStatDto> {
        @Override
        public NewUserStatDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new NewUserStatDto(rs.getString("CREATION_DATE"), rs.getInt("NEW_USERS_COUNT"));
        }
    }

    private static class SystemActivityCountDtoRowMapper implements RowMapper<SystemActivityCountDto> {
        @Override
        public SystemActivityCountDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new SystemActivityCountDto(rs.getString("METRIC"), rs.getInt("COUNT"));
        }
    }

    private static class LeaderboardRankingDtoRowMapper implements RowMapper<LeaderboardRankingDto> {
        @Override
        public LeaderboardRankingDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            java.sql.Date sqlDate = rs.getDate("MEASUREMENT_DATE");
            LocalDate measurementDate = (sqlDate != null) ? sqlDate.toLocalDate() : null;
            return new LeaderboardRankingDto(
                    rs.getString("USERNAME"),
                    rs.getString("EXERCISE_NAME"),
                    rs.getBigDecimal("WEIGHT"),
                    measurementDate,
                    rs.getInt("EXERCISE_RANK")
            );
        }
    }

    @Autowired
    public StatisticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;

        this.getTotalUserCountCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetTotalUserCount");

        this.getUserCountByRoleTypedCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetUserCountByRole_Typed")
                .declareParameters(
                        new SqlOutParameter("return", OracleTypes.CURSOR, new RoleStatDtoRowMapper())
                );

        this.getNewUsersByPeriodCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withProcedureName("GetNewUsersByPeriod")
                .declareParameters(
                        new SqlParameter("p_start_date", Types.DATE),
                        new SqlParameter("p_end_date", Types.DATE),
                        new SqlOutParameter("p_new_user_stats", OracleTypes.CURSOR, new NewUserStatDtoRowMapper()),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );
        this.getTotalTrainerCountCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetTotalTrainerCount");

        this.getTrainerCountBySpecializationTypedCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetTrainerCountBySpecialization_Typed")
                .declareParameters(
                        new SqlOutParameter("return", OracleTypes.CURSOR, new SpecializationStatDtoRowMapper())
                );
        this.getTrainerWorkloadStatsTypedCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetTrainerWorkloadStats_Typed")
                .declareParameters(
                        new SqlOutParameter("return", OracleTypes.CURSOR, new TrainerWorkloadDtoRowMapper())
                );
        this.getMostPopularExercisesInPlansTypedCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetMostPopularExercisesInPlans_Typed")
                .declareParameters(
                        new SqlParameter("p_top_n", Types.NUMERIC),
                        new SqlOutParameter("return", OracleTypes.CURSOR, new ExercisePopularityDtoRowMapper())
                );
        this.getMostPopularExercisesInLeaderboardTypedCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetMostPopularExercisesInLeaderboard_Typed")
                .declareParameters(
                        new SqlParameter("p_top_n", Types.NUMERIC),
                        new SqlOutParameter("return", OracleTypes.CURSOR, new ExercisePopularityDtoRowMapper())
                );

        this.getLeaderboardRankingsForExerciseCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withProcedureName("GetLeaderboardRankingsForExercise")
                .declareParameters(
                        new SqlParameter("p_exercise_id", Types.NUMERIC),
                        new SqlParameter("p_top_n", Types.NUMERIC),
                        new SqlOutParameter("p_rankings", OracleTypes.CURSOR, new LeaderboardRankingDtoRowMapper()),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );

        this.getOverallSystemActivityCountsCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withProcedureName("GetOverallSystemActivityCounts")
                .declareParameters(
                        new SqlOutParameter("p_activity_counts", OracleTypes.CURSOR, new SystemActivityCountDtoRowMapper()),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );
    }

    private boolean checkSuccessFlag(Map<String, Object> result, String procedureName) {
        Object successObj = result.get("p_success");
        if (successObj instanceof Number && ((Number) successObj).intValue() == 1) {
            return true;
        }
        log.warn("Procedura {} nie powiodła się lub nie zwróciła flagi sukcesu (p_success={}).", procedureName, successObj);
        return false;
    }

    public Optional<Long> getTotalUserCount() {
        try {
            Number count = getTotalUserCountCall.executeFunction(Number.class);
            return Optional.ofNullable(count).map(Number::longValue);
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania całkowitej liczby użytkowników", e);
            throw new OperationFailedException("Błąd danych przy pobieraniu całkowitej liczby użytkowników", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<RoleStatDto> getUserCountByRoleTyped() {
        try {
            Map<String, Object> result = getUserCountByRoleTypedCall.execute();
            List<RoleStatDto> stats = (List<RoleStatDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania liczby użytkowników po roli", e);
            throw new OperationFailedException("Błąd danych przy pobieraniu liczby użytkowników po roli: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<NewUserStatDto> getNewUsersByPeriod(LocalDate startDate, LocalDate endDate) {
        try {
            Map<String, Object> params = Map.of("p_start_date", startDate, "p_end_date", endDate);
            Map<String, Object> result = getNewUsersByPeriodCall.execute(params);
            if (checkSuccessFlag(result, "GetNewUsersByPeriod")) {
                List<NewUserStatDto> data = (List<NewUserStatDto>) result.get("p_new_user_stats");
                return data != null ? data : Collections.emptyList();
            }
            return Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania nowych użytkowników w okresie: {} - {}", startDate, endDate, e);
            throw new OperationFailedException("Błąd danych przy pobieraniu nowych użytkowników", e);
        }
    }

    public Optional<Long> getTotalTrainerCount() {
        try {
            Number count = getTotalTrainerCountCall.executeFunction(Number.class);
            return Optional.ofNullable(count).map(Number::longValue);
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania całkowitej liczby trenerów", e);
            throw new OperationFailedException("Błąd danych przy pobieraniu całkowitej liczby trenerów", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<SpecializationStatDto> getTrainerCountBySpecializationTyped() {
        try {
            Map<String, Object> result = getTrainerCountBySpecializationTypedCall.execute();
            List<SpecializationStatDto> stats = (List<SpecializationStatDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania liczby trenerów po specjalizacji", e);
            throw new OperationFailedException("Błąd danych przy pobieraniu liczby trenerów po specjalizacji: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TrainerWorkloadDto> getTrainerWorkloadStatsTyped() {
        try {
            Map<String, Object> result = getTrainerWorkloadStatsTypedCall.execute();
            List<TrainerWorkloadDto> stats = (List<TrainerWorkloadDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania statystyk obciążenia trenerów", e);
            throw new OperationFailedException("Błąd danych przy pobieraniu statystyk obciążenia trenerów: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<ExercisePopularityDto> getMostPopularExercisesInPlansTyped(int topN) {
        try {
            Map<String, Object> result = getMostPopularExercisesInPlansTypedCall.execute(Map.of("p_top_n", topN));
            List<ExercisePopularityDto> stats = (List<ExercisePopularityDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania popularnych ćwiczeń w planach (top {})", topN, e);
            throw new OperationFailedException("Błąd danych przy pobieraniu popularnych ćwiczeń w planach: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<ExercisePopularityDto> getMostPopularExercisesInLeaderboardTyped(int topN) {
        try {
            Map<String, Object> result = getMostPopularExercisesInLeaderboardTypedCall.execute(Map.of("p_top_n", topN));
            List<ExercisePopularityDto> stats = (List<ExercisePopularityDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania popularnych ćwiczeń w leaderboard (top {})", topN, e);
            throw new OperationFailedException("Błąd danych przy pobieraniu popularnych ćwiczeń w leaderboard: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<LeaderboardRankingDto> getLeaderboardRankingsForExercise(Long exerciseId, int topN) {
        try {
            Map<String, Object> params = Map.of("p_exercise_id", exerciseId, "p_top_n", topN);
            Map<String, Object> result = getLeaderboardRankingsForExerciseCall.execute(params);
            if (checkSuccessFlag(result, "GetLeaderboardRankingsForExercise")) {
                List<LeaderboardRankingDto> data = (List<LeaderboardRankingDto>) result.get("p_rankings");
                return data != null ? data : Collections.emptyList();
            }
            return Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania rankingów leaderboard dla ćwiczenia ID: {}", exerciseId, e);
            throw new OperationFailedException("Błąd danych przy pobieraniu rankingów leaderboard", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<SystemActivityCountDto> getOverallSystemActivityCounts() {
        try {
            Map<String, Object> result = getOverallSystemActivityCountsCall.execute();
            if (checkSuccessFlag(result, "GetOverallSystemActivityCounts")) {
                List<SystemActivityCountDto> data = (List<SystemActivityCountDto>) result.get("p_activity_counts");
                return data != null ? data : Collections.emptyList();
            }
            return Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Błąd podczas pobierania ogólnych statystyk aktywności systemu", e);
            throw new OperationFailedException("Błąd danych przy pobieraniu ogólnych statystyk aktywności systemu: " + e.getMessage(), e);
        }
    }
}