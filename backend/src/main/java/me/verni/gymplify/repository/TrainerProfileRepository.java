package me.verni.gymplify.repository;

import lombok.RequiredArgsConstructor;
import me.verni.gymplify.dto.TrainerAdminViewDto;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.util.TrainerAdminViewRowMapper;
import oracle.jdbc.OracleTypes;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.math.BigDecimal;


@Repository
@RequiredArgsConstructor
public class TrainerProfileRepository {

    private final JdbcTemplate jdbcTemplate;

    public Long createTrainerProfile(Long userId, String name, String surname, String specialization, String contact) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_create_trainer")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_surname", Types.VARCHAR),
                        new SqlParameter("p_specialization", Types.VARCHAR),
                        new SqlParameter("p_contact", Types.VARCHAR),
                        new SqlOutParameter("p_trainer_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
        Map<String, Object> params = Map.of(
                "p_user_id", userId,
                "p_name", name,
                "p_surname", surname,
                "p_specialization", specialization,
                "p_contact", contact
        );
        Map<String, Object> result = call.execute(params);
        Boolean success = (Boolean) result.get("p_success");
        if (Boolean.TRUE.equals(success)) {
            Object trainerIdObj = result.get("p_trainer_id");
            if (trainerIdObj instanceof BigDecimal) {
                return ((BigDecimal) trainerIdObj).longValue();
            } else if (trainerIdObj instanceof Number) {
                return ((Number) trainerIdObj).longValue();
            }
            throw new OperationFailedException("Procedure prc_create_trainer returned success but no valid trainer_id.");
        }
        throw new OperationFailedException("Failed to create trainer profile (prc_create_trainer reported failure).");
    }

    @SuppressWarnings("unchecked")
    public List<TrainerAdminViewDto> findAllTrainerProfiles() {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_get_all_trainers")
                .declareParameters(
                        new SqlOutParameter("p_trainers", OracleTypes.CURSOR, new TrainerAdminViewRowMapper()),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
        Map<String, Object> result = call.execute();
        Boolean success = (Boolean) result.get("p_success");
        if (Boolean.TRUE.equals(success)) {
            List<TrainerAdminViewDto> trainers = (List<TrainerAdminViewDto>) result.get("p_trainers");
            return trainers != null ? trainers : List.of();
        }
        throw new OperationFailedException("Failed to retrieve all trainer profiles (prc_get_all_trainers reported failure).");
    }

    @SuppressWarnings("unchecked")
    public Optional<TrainerAdminViewDto> findTrainerProfileById(Long trainerId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_get_trainer_details")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlOutParameter("p_trainer_data", OracleTypes.CURSOR, new TrainerAdminViewRowMapper()),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
        Map<String, Object> params = Map.of("p_trainer_id", trainerId);
        Map<String, Object> result = call.execute(params);
        Boolean success = (Boolean) result.get("p_success");
        if (Boolean.TRUE.equals(success)) {
            List<TrainerAdminViewDto> trainers = (List<TrainerAdminViewDto>) result.get("p_trainer_data");
            if (trainers != null && !trainers.isEmpty()) {
                return Optional.of(trainers.get(0));
            }
        }
        return Optional.empty();
    }

    public boolean updateTrainerProfile(Long trainerId, String name, String surname, String specialization, String contact) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_update_trainer")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_surname", Types.VARCHAR),
                        new SqlParameter("p_specialization", Types.VARCHAR),
                        new SqlParameter("p_contact", Types.VARCHAR),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
        Map<String, Object> params = Map.of(
                "p_trainer_id", trainerId,
                "p_name", name,
                "p_surname", surname,
                "p_specialization", specialization,
                "p_contact", contact
        );
        Map<String, Object> result = call.execute(params);
        return Boolean.TRUE.equals(result.get("p_success"));
    }

    public boolean deleteTrainerProfile(Long trainerId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_delete_trainer")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
        Map<String, Object> result = call.execute(Map.of("p_trainer_id", trainerId));
        return Boolean.TRUE.equals(result.get("p_success"));
    }
}