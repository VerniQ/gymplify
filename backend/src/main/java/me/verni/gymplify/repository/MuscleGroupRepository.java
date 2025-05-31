package me.verni.gymplify.repository;

import me.verni.gymplify.dto.MuscleGroupDto;
import me.verni.gymplify.exception.OperationFailedException;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class MuscleGroupRepository {

    private static final Logger log = LoggerFactory.getLogger(MuscleGroupRepository.class);
    private final JdbcTemplate jdbcTemplate;
    private final SimpleJdbcCall getAllMuscleGroupsCall;
    private final SimpleJdbcCall getMuscleGroupByIdCall;
    private final SimpleJdbcCall addMuscleGroupCall;
    private final SimpleJdbcCall updateMuscleGroupCall;
    private final SimpleJdbcCall deleteMuscleGroupCall;

    @Autowired
    public MuscleGroupRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        MuscleGroupRowMapper muscleGroupRowMapper = new MuscleGroupRowMapper();

        this.getAllMuscleGroupsCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_MUSCLE_GROUP_MGMT")
                .withProcedureName("GetAllMuscleGroups")
                .declareParameters(
                        new SqlOutParameter("p_muscle_groups", OracleTypes.CURSOR, muscleGroupRowMapper),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.getMuscleGroupByIdCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_MUSCLE_GROUP_MGMT")
                .withProcedureName("GetMuscleGroupById")
                .declareParameters(
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_muscle_group", OracleTypes.CURSOR, muscleGroupRowMapper),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.addMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_MUSCLE_GROUP_MGMT")
                .withProcedureName("AddMuscleGroup")
                .declareParameters(
                        new SqlParameter("p_group_name", Types.VARCHAR),
                        new SqlParameter("p_description", Types.CLOB),
                        new SqlOutParameter("p_new_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.updateMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_MUSCLE_GROUP_MGMT")
                .withProcedureName("UpdateMuscleGroup")
                .declareParameters(
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlParameter("p_group_name", Types.VARCHAR),
                        new SqlParameter("p_description", Types.CLOB),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.deleteMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_MUSCLE_GROUP_MGMT")
                .withProcedureName("DeleteMuscleGroup")
                .declareParameters(
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
    }

    private boolean checkSuccessFlag(Map<String, Object> result, String procedureName) {
        Object successObj = result.get("p_success");
        if (successObj == null) {
            log.error("Procedura {} z pakietu PKG_MUSCLE_GROUP_MGMT nie zwróciła flagi p_success.", procedureName);
            throw new OperationFailedException("Procedura " + procedureName + " nie zwróciła statusu powodzenia.");
        }
        if (successObj instanceof Boolean) {
            return (Boolean) successObj;
        }
        if (successObj instanceof Number) {
            return ((Number) successObj).intValue() != 0;
        }
        log.error("Procedura {} z pakietu PKG_MUSCLE_GROUP_MGMT zwróciła nieoczekiwany typ dla p_success: {}", procedureName, successObj.getClass().getName());
        throw new OperationFailedException("Procedura " + procedureName + " zwróciła nieprawidłowy status powodzenia.");
    }


    @SuppressWarnings("unchecked")
    public List<MuscleGroupDto> findAll() {
        try {
            Map<String, Object> result = getAllMuscleGroupsCall.execute();
            if (checkSuccessFlag(result, "GetAllMuscleGroups")) {
                List<MuscleGroupDto> groups = (List<MuscleGroupDto>) result.get("p_muscle_groups");
                return groups != null ? groups : List.of();
            }
            log.warn("Procedura GetAllMuscleGroups z pakietu PKG_MUSCLE_GROUP_MGMT zwróciła p_success=false.");
            throw new OperationFailedException("Nie udało się pobrać listy grup mięśniowych (procedura z pakietu zgłosiła błąd).");
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetAllMuscleGroups z PKG_MUSCLE_GROUP_MGMT", e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania grup mięśniowych: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<MuscleGroupDto> findById(Long id) {
        try {
            Map<String, Object> result = getMuscleGroupByIdCall.execute(Map.of("p_group_id", id));
            if (checkSuccessFlag(result, "GetMuscleGroupById")) {
                List<MuscleGroupDto> list = (List<MuscleGroupDto>) result.get("p_muscle_group");
                return list != null && !list.isEmpty() ? Optional.of(list.get(0)) : Optional.empty();
            }
            log.info("Procedura GetMuscleGroupById z pakietu PKG_MUSCLE_GROUP_MGMT nie znalazła grupy o ID {} lub zwróciła p_success=false.", id);
            return Optional.empty();
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetMuscleGroupById z PKG_MUSCLE_GROUP_MGMT dla ID {}", id, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }

    public Long save(String groupName, String description) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("p_group_name", groupName);
            params.put("p_description", description);

            Map<String, Object> result = addMuscleGroupCall.execute(params);

            if (checkSuccessFlag(result, "AddMuscleGroup")) {
                Object newGroupIdObj = result.get("p_new_group_id");
                if (newGroupIdObj instanceof Number) {
                    return ((Number) newGroupIdObj).longValue();
                }
                log.error("Procedura AddMuscleGroup z pakietu PKG_MUSCLE_GROUP_MGMT zakończyła się sukcesem, ale nie zwróciła poprawnego ID grupy.");
                throw new OperationFailedException("Procedura dodawania grupy zakończyła się sukcesem, ale nie zwróciła poprawnego ID grupy.");
            } else {
                log.warn("Procedura AddMuscleGroup z pakietu PKG_MUSCLE_GROUP_MGMT zwróciła p_success=false dla: {}", groupName);
                throw new OperationFailedException("Nie udało się dodać grupy mięśniowej. Procedura PL/SQL z pakietu zgłosiła błąd (możliwy duplikat nazwy: '" + groupName + "').");
            }
        } catch (DuplicateKeyException e) {
            log.warn("Próba dodania grupy mięśniowej o zduplikowanej nazwie: {}", groupName, e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania AddMuscleGroup z PKG_MUSCLE_GROUP_MGMT dla: {}", groupName, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas dodawania grupy mięśniowej: " + e.getMessage(), e);
        }
    }

    public boolean update(Long id, String groupName, String description) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("p_group_id", id);
            params.put("p_group_name", groupName);
            params.put("p_description", description);

            Map<String, Object> result = updateMuscleGroupCall.execute(params);
            boolean success = checkSuccessFlag(result, "UpdateMuscleGroup");

            if (!success) {
                log.warn("Procedura UpdateMuscleGroup z pakietu PKG_MUSCLE_GROUP_MGMT zwróciła p_success=false dla ID: {} (np. grupa nie istnieje lub nazwa zduplikowana).", id);
            }
            return success;
        } catch (DuplicateKeyException e) {
            log.warn("Próba aktualizacji grupy mięśniowej ID: {} na zduplikowaną nazwę: {}", id, groupName, e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania UpdateMuscleGroup z PKG_MUSCLE_GROUP_MGMT dla ID: {}", id, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas aktualizacji grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }

    public boolean deleteById(Long id) {
        try {
            Map<String, Object> result = deleteMuscleGroupCall.execute(Map.of("p_group_id", id));
            boolean success = checkSuccessFlag(result, "DeleteMuscleGroup");

            if (!success) {
                log.warn("Procedura DeleteMuscleGroup z pakietu PKG_MUSCLE_GROUP_MGMT zwróciła p_success=false dla ID: {} (np. grupa nie istnieje lub ma powiązane ćwiczenia).", id);
            }
            return success;
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania DeleteMuscleGroup z PKG_MUSCLE_GROUP_MGMT dla ID: {}", id, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas usuwania grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }

    private static class MuscleGroupRowMapper implements RowMapper<MuscleGroupDto> {
        @Override
        public MuscleGroupDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new MuscleGroupDto(
                    rs.getLong("GROUP_ID"),
                    rs.getString("GROUP_NAME"),
                    rs.getString("DESCRIPTION")
            );
        }
    }
}