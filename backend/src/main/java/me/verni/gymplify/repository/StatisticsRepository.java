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
    private final SimpleJdbcCall getOverallSystemActivityCountsCall;
    private final SimpleJdbcCall getExerciseCountByMuscleGroupCall;
    private final SimpleJdbcCall getMostAssignedTrainingPlansCall;


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
            return new SystemActivityCountDto(rs.getString("METRIC"), rs.getInt("COUNT_VALUE"));
        }
    }

    private static class PopularPlanDtoRowMapper implements RowMapper<PopularPlanDto> {
        @Override
        public PopularPlanDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new PopularPlanDto(rs.getString("PLAN_NAME"), rs.getInt("ASSIGNMENTS_COUNT"));
        }
    }

    private static class ExerciseCountByMuscleGroupDtoRowMapper implements RowMapper<ExerciseCountByMuscleGroupDto> {
        @Override
        public ExerciseCountByMuscleGroupDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new ExerciseCountByMuscleGroupDto(rs.getString("GROUP_NAME"), rs.getInt("EXERCISE_COUNT"));
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

        this.getExerciseCountByMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withProcedureName("GetExerciseCountByMuscleGroup")
                .declareParameters(
                        new SqlOutParameter("p_exercise_muscle_group_stats", OracleTypes.CURSOR, new ExerciseCountByMuscleGroupDtoRowMapper()),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );

        this.getMostPopularExercisesInPlansTypedCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withFunctionName("GetMostPopularExercisesInPlans_Typed")
                .declareParameters(
                        new SqlParameter("p_top_n", Types.NUMERIC),
                        new SqlOutParameter("return", OracleTypes.CURSOR, new ExercisePopularityDtoRowMapper())
                );

        this.getMostAssignedTrainingPlansCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_APP_STATISTICS")
                .withProcedureName("GetMostAssignedTrainingPlans")
                .declareParameters(
                        new SqlParameter("p_top_n", Types.NUMERIC),
                        new SqlOutParameter("p_popular_plans", OracleTypes.CURSOR, new PopularPlanDtoRowMapper()),
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
        log.warn("Procedure {} did not succeed or did not return a success flag (p_success={}).", procedureName, successObj);
        return false;
    }

    public Optional<Long> getTotalUserCount() {
        try {
            Number count = getTotalUserCountCall.executeFunction(Number.class);
            return Optional.ofNullable(count).map(Number::longValue);
        } catch (DataAccessException e) {
            log.error("Error fetching total user count", e);
            throw new OperationFailedException("Data error fetching total user count", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<RoleStatDto> getUserCountByRoleTyped() {
        try {
            Map<String, Object> result = getUserCountByRoleTypedCall.execute();
            List<RoleStatDto> stats = (List<RoleStatDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Error fetching user count by role", e);
            throw new OperationFailedException("Data error fetching user count by role: " + e.getMessage(), e);
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
            log.error("Error fetching new users in period: {} - {}", startDate, endDate, e);
            throw new OperationFailedException("Data error fetching new users", e);
        }
    }

    public Optional<Long> getTotalTrainerCount() {
        try {
            Number count = getTotalTrainerCountCall.executeFunction(Number.class);
            return Optional.ofNullable(count).map(Number::longValue);
        } catch (DataAccessException e) {
            log.error("Error fetching total trainer count", e);
            throw new OperationFailedException("Data error fetching total trainer count", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<SpecializationStatDto> getTrainerCountBySpecializationTyped() {
        try {
            Map<String, Object> result = getTrainerCountBySpecializationTypedCall.execute();
            List<SpecializationStatDto> stats = (List<SpecializationStatDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Error fetching trainer count by specialization", e);
            throw new OperationFailedException("Data error fetching trainer count by specialization: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TrainerWorkloadDto> getTrainerWorkloadStatsTyped() {
        try {
            Map<String, Object> result = getTrainerWorkloadStatsTypedCall.execute();
            List<TrainerWorkloadDto> stats = (List<TrainerWorkloadDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Error fetching trainer workload statistics", e);
            throw new OperationFailedException("Data error fetching trainer workload statistics: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<ExerciseCountByMuscleGroupDto> getExerciseCountByMuscleGroup() {
        try {
            Map<String, Object> result = getExerciseCountByMuscleGroupCall.execute();
            if (checkSuccessFlag(result, "GetExerciseCountByMuscleGroup")) {
                List<ExerciseCountByMuscleGroupDto> data = (List<ExerciseCountByMuscleGroupDto>) result.get("p_exercise_muscle_group_stats");
                return data != null ? data : Collections.emptyList();
            }
            return Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Error fetching exercise count by muscle group", e);
            throw new OperationFailedException("Data error fetching exercise count by muscle group", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<ExercisePopularityDto> getMostPopularExercisesInPlansTyped(int topN) {
        try {
            Map<String, Object> result = getMostPopularExercisesInPlansTypedCall.execute(Map.of("p_top_n", topN));
            List<ExercisePopularityDto> stats = (List<ExercisePopularityDto>) result.get("return");
            return stats != null ? stats : Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Error fetching popular exercises in plans (top {})", topN, e);
            throw new OperationFailedException("Data error fetching popular exercises in plans: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<PopularPlanDto> getMostAssignedTrainingPlans(int topN) {
        try {
            Map<String, Object> params = Map.of("p_top_n", topN);
            Map<String, Object> result = getMostAssignedTrainingPlansCall.execute(params);
            if (checkSuccessFlag(result, "GetMostAssignedTrainingPlans")) {
                List<PopularPlanDto> data = (List<PopularPlanDto>) result.get("p_popular_plans");
                return data != null ? data : Collections.emptyList();
            }
            return Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Error fetching most assigned training plans (top {})", topN, e);
            throw new OperationFailedException("Data error fetching most assigned training plans", e);
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
            log.warn("Procedure GetOverallSystemActivityCounts failed, returning empty list.");
            return Collections.emptyList();
        } catch (DataAccessException e) {
            log.error("Error fetching overall system activity counts", e);
            throw new OperationFailedException("Data error fetching overall system activity counts: " + e.getMessage(), e);
        }
    }
}