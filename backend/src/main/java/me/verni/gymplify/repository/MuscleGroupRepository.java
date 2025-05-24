package me.verni.gymplify.repository;

import me.verni.gymplify.dto.MuscleGroupDto;
import me.verni.gymplify.exception.OperationFailedException;
import oracle.jdbc.OracleTypes;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class MuscleGroupRepository {

    private final JdbcTemplate jdbcTemplate;
    private final SimpleJdbcCall getAllMuscleGroupsCall;
    private final SimpleJdbcCall getMuscleGroupByIdCall;
    private final SimpleJdbcCall addMuscleGroupCall;
    private final SimpleJdbcCall updateMuscleGroupCall;
    private final SimpleJdbcCall deleteMuscleGroupCall;

    @Autowired
    public MuscleGroupRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;

        this.getAllMuscleGroupsCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_get_all_muscle_groups")
                .declareParameters(
                        new SqlOutParameter("p_muscle_groups", OracleTypes.CURSOR, new MuscleGroupRowMapper()),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.getMuscleGroupByIdCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_get_muscle_group_by_id")
                .declareParameters(
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_muscle_group", OracleTypes.CURSOR, new MuscleGroupRowMapper()),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.addMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_add_muscle_group")
                .declareParameters(
                        new SqlParameter("p_group_name", Types.VARCHAR),
                        new SqlParameter("p_description", Types.CLOB),
                        new SqlOutParameter("p_new_group_id", Types.NUMERIC), // Kluczowe dla pobrania ID
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.updateMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_update_muscle_group")
                .declareParameters(
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlParameter("p_group_name", Types.VARCHAR),
                        new SqlParameter("p_description", Types.CLOB),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.deleteMuscleGroupCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_delete_muscle_group")
                .declareParameters(
                        new SqlParameter("p_group_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
    }

    @SuppressWarnings("unchecked")
    public List<MuscleGroupDto> findAll() {
        try {
            Map<String, Object> result = getAllMuscleGroupsCall.execute();
            Boolean success = (Boolean) result.get("p_success");
            if (Boolean.TRUE.equals(success)) {
                List<MuscleGroupDto> groups = (List<MuscleGroupDto>) result.get("p_muscle_groups");
                return groups != null ? groups : List.of();
            }
            throw new OperationFailedException("Nie udało się pobrać listy grup mięśniowych (procedura zwróciła błąd).");
        } catch (DataAccessException e) {
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania grup mięśniowych: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<MuscleGroupDto> findById(Long id) {
        try {
            Map<String, Object> result = getMuscleGroupByIdCall.execute(Map.of("p_group_id", id));
            Boolean success = (Boolean) result.get("p_success");
            if (Boolean.TRUE.equals(success)) {
                List<MuscleGroupDto> list = (List<MuscleGroupDto>) result.get("p_muscle_group");
                return list != null && !list.isEmpty() ? Optional.of(list.get(0)) : Optional.empty();
            }
            return Optional.empty();
        } catch (DataAccessException e) {
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }

    public Long save(String groupName, String description) {
        try {
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("p_group_name", groupName);
            params.put("p_description", description);

            Map<String, Object> result = addMuscleGroupCall.execute(params);
            Boolean success = (Boolean) result.get("p_success");

            if (Boolean.TRUE.equals(success)) {
                Object newGroupIdObj = result.get("p_new_group_id");
                if (newGroupIdObj instanceof Number) {
                    return ((Number) newGroupIdObj).longValue();
                } else {
                    throw new OperationFailedException("Procedura dodawania grupy zakończyła się sukcesem, ale nie zwróciła poprawnego ID grupy.");
                }
            } else {
                throw new OperationFailedException("Nie udało się dodać grupy mięśniowej. Procedura PL/SQL zgłosiła błąd (możliwy duplikat nazwy: '" + groupName + "').");
            }
        } catch (DuplicateKeyException e) {
            throw e;
        } catch (DataAccessException e) {
            throw new OperationFailedException("Błąd dostępu do danych podczas dodawania grupy mięśniowej: " + e.getMessage(), e);
        }
    }

    public boolean update(Long id, String groupName, String description) {
        try {
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("p_group_id", id);
            params.put("p_group_name", groupName);
            params.put("p_description", description);

            Map<String, Object> result = updateMuscleGroupCall.execute(params);
            Boolean success = (Boolean) result.get("p_success");
            if (success == null) {
                throw new OperationFailedException("Procedura aktualizacji grupy nie zwróciła statusu powodzenia.");
            }
            return success;
        } catch (DuplicateKeyException e) {
            throw e;
        } catch (DataAccessException e) {
            throw new OperationFailedException("Błąd dostępu do danych podczas aktualizacji grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }

    public boolean deleteById(Long id) {
        try {
            Map<String, Object> result = deleteMuscleGroupCall.execute(Map.of("p_group_id", id));
            Boolean success = (Boolean) result.get("p_success");
            if (success == null) {
                throw new OperationFailedException("Procedura usuwania grupy nie zwróciła statusu powodzenia.");
            }
            return success;
        } catch (DataAccessException e) {

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