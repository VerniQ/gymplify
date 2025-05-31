package me.verni.gymplify.repository;

import me.verni.gymplify.dto.ExerciseDto;
import me.verni.gymplify.dto.ExerciseRequestDto;
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

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class ExerciseRepository {

    private static final Logger log = LoggerFactory.getLogger(ExerciseRepository.class);
    private final JdbcTemplate jdbcTemplate;

    private final SimpleJdbcCall getAllExercisesCall;
    private final SimpleJdbcCall getExerciseByIdCall;
    private final SimpleJdbcCall findExercisesByMuscleGroupCall;
    private final SimpleJdbcCall addExerciseCall;
    private final SimpleJdbcCall updateExerciseCall;
    private final SimpleJdbcCall deleteExerciseCall;

    private static class ExerciseDtoRowMapper implements RowMapper<ExerciseDto> {
        @Override
        public ExerciseDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            Long groupId = rs.getObject("GROUP_ID") == null ? null : rs.getLong("GROUP_ID");
            String groupName = null;

            try {
                rs.findColumn("GROUP_NAME");
                groupName = rs.getString("GROUP_NAME");
            } catch (SQLException e) {
                log.trace("Kolumna GROUP_NAME nie znaleziona w ResultSet dla mapowania ExerciseDto. Id ćwiczenia: {}", rs.getLong("EXERCISE_ID"));
            }

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
    public ExerciseRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        ExerciseDtoRowMapper exerciseDtoRowMapper = new ExerciseDtoRowMapper();

        this.getAllExercisesCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_EXERCISE_MGMT")
                .withProcedureName("GetAllExercises")
                .declareParameters(
                        new SqlOutParameter("p_exercises", OracleTypes.CURSOR, exerciseDtoRowMapper),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );

        this.getExerciseByIdCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_EXERCISE_MGMT")
                .withProcedureName("GetExerciseDetails")
                .declareParameters(
                        new SqlParameter("p_exercise_id", Types.NUMERIC),
                        new SqlOutParameter("p_exercise_data", OracleTypes.CURSOR, exerciseDtoRowMapper),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );

        this.findExercisesByMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_EXERCISE_MGMT")
                .withProcedureName("FindExercisesByMuscleGroup")
                .declareParameters(
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_exercises", OracleTypes.CURSOR, exerciseDtoRowMapper),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );

        this.addExerciseCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_EXERCISE_MGMT")
                .withProcedureName("CreateExercise")
                .declareParameters(
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_description", Types.CLOB),
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_exercise_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );

        this.updateExerciseCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_EXERCISE_MGMT")
                .withProcedureName("UpdateExercise")
                .declareParameters(
                        new SqlParameter("p_exercise_id", Types.NUMERIC),
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_description", Types.CLOB),
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );

        this.deleteExerciseCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_EXERCISE_MGMT")
                .withProcedureName("DeleteExercise")
                .declareParameters(
                        new SqlParameter("p_exercise_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.NUMERIC)
                );
    }

    private boolean checkSuccessFlag(Map<String, Object> result, String procedureName) {
        Object successObj = result.get("p_success");
        if (successObj == null) {
            log.error("Procedura {} z pakietu PKG_EXERCISE_MGMT nie zwróciła flagi p_success.", procedureName);
            throw new OperationFailedException("Procedura " + procedureName + " nie zwróciła statusu powodzenia.");
        }
        if (successObj instanceof Number) {
            return ((Number) successObj).intValue() == 1;
        }
        log.error("Procedura {} z pakietu PKG_EXERCISE_MGMT zwróciła nieoczekiwany typ dla p_success: {}", procedureName, successObj.getClass().getName());
        throw new OperationFailedException("Procedura " + procedureName + " zwróciła nieprawidłowy status powodzenia.");
    }


    @SuppressWarnings("unchecked")
    public List<ExerciseDto> findAll() {
        try {
            Map<String, Object> result = getAllExercisesCall.execute();
            if (checkSuccessFlag(result, "GetAllExercises")) {
                List<ExerciseDto> exercises = (List<ExerciseDto>) result.get("p_exercises");
                return exercises != null ? exercises : List.of();
            }
            log.warn("Procedura GetAllExercises z pakietu PKG_EXERCISE_MGMT zwróciła p_success=0 (błąd).");
            throw new OperationFailedException("Nie udało się pobrać listy ćwiczeń (procedura z pakietu zgłosiła błąd).");
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetAllExercises z PKG_EXERCISE_MGMT", e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania ćwiczeń: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<ExerciseDto> findById(Long id) {
        try {
            Map<String, Object> result = getExerciseByIdCall.execute(Map.of("p_exercise_id", id));
            if (checkSuccessFlag(result, "GetExerciseDetails")) {
                List<ExerciseDto> list = (List<ExerciseDto>) result.get("p_exercise_data");
                return list != null && !list.isEmpty() ? Optional.of(list.get(0)) : Optional.empty();
            }
            log.info("Procedura GetExerciseDetails z pakietu PKG_EXERCISE_MGMT nie znalazła ćwiczenia o ID {} lub zwróciła błąd (p_success=0).", id);
            return Optional.empty();
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetExerciseDetails z PKG_EXERCISE_MGMT dla ID {}", id, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania ćwiczenia o ID " + id + ": " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<ExerciseDto> findByMuscleGroupId(Long groupId) {
        try {
            Map<String, Object> result = findExercisesByMuscleGroupCall.execute(Map.of("p_group_id", groupId));
            if (checkSuccessFlag(result, "FindExercisesByMuscleGroup")) {
                List<ExerciseDto> exercises = (List<ExerciseDto>) result.get("p_exercises");
                return exercises != null ? exercises : List.of();
            }
            log.warn("Procedura FindExercisesByMuscleGroup z pakietu PKG_EXERCISE_MGMT zwróciła p_success=0 dla grupy ID: {}", groupId);
            throw new OperationFailedException("Nie udało się pobrać ćwiczeń dla grupy mięśniowej ID " + groupId + " (procedura z pakietu zgłosiła błąd lub grupa nie istnieje).");
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania FindExercisesByMuscleGroup z PKG_EXERCISE_MGMT dla grupy ID: {}", groupId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania ćwiczeń dla grupy: " + e.getMessage(), e);
        }
    }

    public Long save(ExerciseRequestDto requestDto) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("p_name", requestDto.getName());
            params.put("p_description", requestDto.getDescription());
            params.put("p_group_id", requestDto.getGroupId());

            Map<String, Object> result = addExerciseCall.execute(params);

            if (checkSuccessFlag(result, "CreateExercise")) {
                Object newExerciseIdObj = result.get("p_exercise_id");
                if (newExerciseIdObj instanceof BigDecimal) {
                    return ((BigDecimal) newExerciseIdObj).longValue();
                } else if (newExerciseIdObj instanceof Number) {
                    return ((Number) newExerciseIdObj).longValue();
                }
                log.error("Procedura CreateExercise z pakietu PKG_EXERCISE_MGMT zakończyła się sukcesem (p_success=1), ale nie zwróciła poprawnego ID ćwiczenia.");
                throw new OperationFailedException("Procedura tworzenia ćwiczenia zwróciła sukces, ale nieprawidłowe ID.");
            } else {
                log.warn("Procedura CreateExercise z pakietu PKG_EXERCISE_MGMT zwróciła p_success=0 dla: {}", requestDto.getName());
                throw new OperationFailedException("Nie udało się dodać ćwiczenia. Procedura PL/SQL z pakietu zgłosiła błąd walidacji lub wewnętrzny.");
            }
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania CreateExercise z PKG_EXERCISE_MGMT dla: {}", requestDto.getName(), e);
            throw new OperationFailedException("Błąd dostępu do danych podczas dodawania ćwiczenia: " + e.getMessage(), e);
        }
    }

    public boolean update(Long id, ExerciseRequestDto requestDto) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("p_exercise_id", id);
            params.put("p_name", requestDto.getName());
            params.put("p_description", requestDto.getDescription());
            params.put("p_group_id", requestDto.getGroupId());

            Map<String, Object> result = updateExerciseCall.execute(params);
            boolean success = checkSuccessFlag(result, "UpdateExercise");

            if(!success) {
                log.warn("Procedura UpdateExercise z pakietu PKG_EXERCISE_MGMT zwróciła p_success=0 dla ID: {} (np. ćwiczenie lub grupa nie istnieje).", id);
            }
            return success;
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania UpdateExercise z PKG_EXERCISE_MGMT dla ID: {}", id, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas aktualizacji ćwiczenia o ID " + id + ": " + e.getMessage(), e);
        }
    }

    public boolean deleteById(Long id) {
        try {
            Map<String, Object> result = deleteExerciseCall.execute(Map.of("p_exercise_id", id));
            boolean success = checkSuccessFlag(result, "DeleteExercise");

            if(!success) {
                log.warn("Procedura DeleteExercise z pakietu PKG_EXERCISE_MGMT zwróciła p_success=0 dla ID: {} (np. ćwiczenie nie istnieje).", id);
            }
            return success;
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania DeleteExercise z PKG_EXERCISE_MGMT dla ID: {}", id, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas usuwania ćwiczenia o ID " + id + ": " + e.getMessage(), e);
        }
    }
}