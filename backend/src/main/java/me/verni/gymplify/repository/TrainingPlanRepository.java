package me.verni.gymplify.repository;

import me.verni.gymplify.dto.ExerciseDto;
import me.verni.gymplify.dto.TrainingPlanDto;
import me.verni.gymplify.exception.DataAccessExceptionWrapper;
import me.verni.gymplify.exception.OperationFailedException;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class TrainingPlanRepository {

    private static final Logger log = LoggerFactory.getLogger(TrainingPlanRepository.class);
    private final JdbcTemplate jdbcTemplate;

    private final SimpleJdbcCall createTrainingPlanCall;
    private final SimpleJdbcCall deleteTrainingPlanCall;
    private final SimpleJdbcCall updateTrainingPlanCall;
    private final SimpleJdbcCall getTrainingPlanByIdCall;
    private final SimpleJdbcCall listAllTrainingPlansCall;
    private final SimpleJdbcCall addExerciseToPlanCall;
    private final SimpleJdbcCall removeExerciseFromPlanCall;
    private final SimpleJdbcCall removeAllExercisesFromPlanCall;
    private final SimpleJdbcCall getExercisesForPlanCall;

    private static class TrainingPlanDtoRowMapper implements RowMapper<TrainingPlanDto> {
        @Override
        public TrainingPlanDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new TrainingPlanDto(
                    rs.getLong("PLAN_ID"),
                    rs.getString("NAME")
            );
        }
    }

    private static class LocalExerciseDtoRowMapper implements RowMapper<ExerciseDto> {
        @Override
        public ExerciseDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            Long groupId = rs.getObject("GROUP_ID") == null ? null : rs.getLong("GROUP_ID");
            String groupName = rs.getString("MUSCLE_GROUP_NAME");

            return new ExerciseDto(
                    rs.getLong("EXERCISE_ID"),
                    rs.getString("NAME"),
                    rs.getString("DESCRIPTION"),
                    groupId,
                    groupName
            );
        }
    }


    @Autowired
    public TrainingPlanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        TrainingPlanDtoRowMapper trainingPlanDtoRowMapper = new TrainingPlanDtoRowMapper();
        LocalExerciseDtoRowMapper exerciseDtoRowMapper = new LocalExerciseDtoRowMapper();


        this.createTrainingPlanCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("CreateTrainingPlan")
                .declareParameters(
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlOutParameter("p_plan_id", Types.NUMERIC)
                )
                .withoutProcedureColumnMetaDataAccess();

        this.deleteTrainingPlanCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("DeleteTrainingPlan")
                .declareParameters(
                        new SqlParameter("p_plan_id", Types.NUMERIC)
                )
                .withoutProcedureColumnMetaDataAccess();

        this.updateTrainingPlanCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("UpdateTrainingPlan")
                .declareParameters(
                        new SqlParameter("p_plan_id", Types.NUMERIC),
                        new SqlParameter("p_name", Types.VARCHAR)
                )
                .withoutProcedureColumnMetaDataAccess();

        this.getTrainingPlanByIdCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("GetTrainingPlanById_Proc")
                .declareParameters(
                        new SqlParameter("p_plan_id", Types.NUMERIC),
                        new SqlOutParameter("p_cursor", OracleTypes.CURSOR, trainingPlanDtoRowMapper)
                )
                .withoutProcedureColumnMetaDataAccess();


        this.listAllTrainingPlansCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("ListAllTrainingPlans_Proc")
                .declareParameters(
                        new SqlOutParameter("p_cursor", OracleTypes.CURSOR, trainingPlanDtoRowMapper)
                )
                .withoutProcedureColumnMetaDataAccess();

        this.addExerciseToPlanCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("AddExerciseToPlan")
                .declareParameters(
                        new SqlParameter("p_plan_id", Types.NUMERIC),
                        new SqlParameter("p_exercise_id", Types.NUMERIC)
                )
                .withoutProcedureColumnMetaDataAccess();

        this.removeExerciseFromPlanCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("RemoveExerciseFromPlan")
                .declareParameters(
                        new SqlParameter("p_plan_id", Types.NUMERIC),
                        new SqlParameter("p_exercise_id", Types.NUMERIC)
                )
                .withoutProcedureColumnMetaDataAccess();

        this.removeAllExercisesFromPlanCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("RemoveAllExercisesFromPlan")
                .declareParameters(
                        new SqlParameter("p_plan_id", Types.NUMERIC)
                )
                .withoutProcedureColumnMetaDataAccess();

        this.getExercisesForPlanCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINING_PLAN_MGMT")
                .withProcedureName("GetExercisesForPlan_Proc")
                .declareParameters(
                        new SqlParameter("p_plan_id", Types.NUMERIC),
                        new SqlOutParameter("p_cursor", OracleTypes.CURSOR, exerciseDtoRowMapper)
                )
                .withoutProcedureColumnMetaDataAccess();
    }

    public Long create(String name) {
        try {
            Map<String, Object> params = Map.of("p_name", name);
            Map<String, Object> result = createTrainingPlanCall.execute(params);
            Object planIdObj = result.get("p_plan_id");
            if (planIdObj instanceof BigDecimal) {
                return ((BigDecimal) planIdObj).longValue();
            } else if (planIdObj instanceof Number) {
                return ((Number) planIdObj).longValue();
            }
            log.error("Procedura CreateTrainingPlan zakończyła się sukcesem, ale nie zwróciła poprawnego ID planu.");
            throw new OperationFailedException("Tworzenie planu treningowego zakończyło się sukcesem, ale nie zwrócono ID.");
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas tworzenia planu treningowego '{}': {}", name, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() == 1) {
                    throw new OperationFailedException("Plan treningowy o nazwie '" + name + "' już istnieje.", e);
                } else if (sqlEx.getErrorCode() >= 20000 && sqlEx.getErrorCode() <= 20999 && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas tworzenia planu treningowego: " + e.getMessage(), e);
        }
    }

    public void deleteById(Long planId) {
        try {
            deleteTrainingPlanCall.execute(Map.of("p_plan_id", planId));
            log.info("Wywołano DeleteTrainingPlan dla plan_id: {}", planId);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas usuwania planu treningowego ID {}: {}", planId, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() >= 20000 && sqlEx.getErrorCode() <= 20999 && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas usuwania planu treningowego ID " + planId + ": " + e.getMessage(), e);
        }
    }

    public void update(Long planId, String newName) {
        try {
            Map<String, Object> params = Map.of("p_plan_id", planId, "p_name", newName);
            updateTrainingPlanCall.execute(params);
            log.info("Wywołano UpdateTrainingPlan dla plan_id: {}", planId);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas aktualizacji planu treningowego ID {}: {}", planId, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() == 1) {
                    throw new OperationFailedException("Plan treningowy o nazwie '" + newName + "' już istnieje.", e);
                } else if (sqlEx.getErrorCode() >= 20000 && sqlEx.getErrorCode() <= 20999 && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas aktualizacji planu treningowego ID " + planId + ": " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<TrainingPlanDto> findById(Long planId) {
        try {
            Map<String, Object> inParams = Map.of("p_plan_id", planId);
            Map<String, Object> result = getTrainingPlanByIdCall.execute(inParams);
            List<TrainingPlanDto> list = (List<TrainingPlanDto>) result.get("p_cursor");
            if (list != null && !list.isEmpty()) {
                return Optional.of(list.get(0));
            }
            log.info("Procedura GetTrainingPlanById_Proc nie znalazła planu o ID {}", planId);
            return Optional.empty();
        } catch (EmptyResultDataAccessException e) {
            log.info("Nie znaleziono planu treningowego o ID: {} (EmptyResultDataAccessException)", planId);
            return Optional.empty();
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas pobierania planu treningowego ID {}: {}", planId, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() == 20300 && sqlEx.getMessage() != null) {
                    log.info("Procedura GetTrainingPlanById_Proc zgłosiła błąd -20300 dla planu ID {}", planId);
                    return Optional.empty();
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas pobierania planu treningowego ID " + planId + ": " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TrainingPlanDto> findAll() {
        try {
            Map<String, Object> result = listAllTrainingPlansCall.execute();
            List<TrainingPlanDto> plans = (List<TrainingPlanDto>) result.get("p_cursor");
            return plans != null ? plans : List.of();
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas pobierania wszystkich planów treningowych: {}", e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() >= 20000 && sqlEx.getErrorCode() <= 20999 && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas pobierania wszystkich planów treningowych: " + e.getMessage(), e);
        }
    }

    public void addExerciseToPlan(Long planId, Long exerciseId) {
        try {
            addExerciseToPlanCall.execute(Map.of("p_plan_id", planId, "p_exercise_id", exerciseId));
            log.info("Wywołano AddExerciseToPlan dla plan_id: {} i exercise_id: {}", planId, exerciseId);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas dodawania ćwiczenia {} do planu {}: {}", exerciseId, planId, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if ((sqlEx.getErrorCode() == 20300 || sqlEx.getErrorCode() == 20011 || sqlEx.getErrorCode() == 20305) && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                } else if (sqlEx.getErrorCode() == 1) {
                    throw new OperationFailedException("Ćwiczenie ID " + exerciseId + " jest już w planie ID " + planId + ".", e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas dodawania ćwiczenia " + exerciseId + " do planu " + planId + ": " + e.getMessage(), e);
        }
    }

    public void removeExerciseFromPlan(Long planId, Long exerciseId) {
        try {
            removeExerciseFromPlanCall.execute(Map.of("p_plan_id", planId, "p_exercise_id", exerciseId));
            log.info("Wywołano RemoveExerciseFromPlan dla plan_id: {} i exercise_id: {}", planId, exerciseId);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas usuwania ćwiczenia {} z planu {}: {}", exerciseId, planId, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() == 20302 && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas usuwania ćwiczenia " + exerciseId + " z planu " + planId + ": " + e.getMessage(), e);
        }
    }

    public void removeAllExercisesFromPlan(Long planId) {
        try {
            removeAllExercisesFromPlanCall.execute(Map.of("p_plan_id", planId));
            log.info("Wywołano RemoveAllExercisesFromPlan dla plan_id: {}", planId);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas usuwania wszystkich ćwiczeń z planu {}: {}", planId, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() == 20300 && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas usuwania wszystkich ćwiczeń z planu " + planId + ": " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<ExerciseDto> getExercisesForPlan(Long planId) {
        try {
            Map<String, Object> inParams = Map.of("p_plan_id", planId);
            Map<String, Object> result = getExercisesForPlanCall.execute(inParams);
            List<ExerciseDto> exercises = (List<ExerciseDto>) result.get("p_cursor");
            return exercises != null ? exercises : List.of();
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas pobierania ćwiczeń dla planu {}: {}", planId, e.getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() == 20300 && sqlEx.getMessage() != null) {
                    throw new OperationFailedException(sqlEx.getMessage().split("\n")[0], e);
                }
            }
            throw new DataAccessExceptionWrapper("Błąd podczas pobierania ćwiczeń dla planu " + planId + ": " + e.getMessage(), e);
        }
    }
}