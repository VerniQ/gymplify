package me.verni.gymplify.repository;

import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.dto.MuscleGroupDto;
import oracle.jdbc.OracleTypes;
import org.springframework.beans.factory.annotation.Autowired;
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
                        new SqlOutParameter("p_new_group_id", Types.NUMERIC),
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
        Map<String, Object> result = getAllMuscleGroupsCall.execute();
        Boolean success = (Boolean) result.get("p_success");
        if (Boolean.TRUE.equals(success)) {
            return (List<MuscleGroupDto>) result.get("p_muscle_groups");
        }
        throw new OperationFailedException("Nie udało się pobrać listy grup mięśniowych.");
    }

    @SuppressWarnings("unchecked")
    public Optional<MuscleGroupDto> findById(Long id) {
        Map<String, Object> result = getMuscleGroupByIdCall.execute(Map.of("p_group_id", id));
        Boolean success = (Boolean) result.get("p_success");
        if (Boolean.TRUE.equals(success)) {
            List<MuscleGroupDto> list = (List<MuscleGroupDto>) result.get("p_muscle_group");
            return list != null && !list.isEmpty() ? Optional.of(list.get(0)) : Optional.empty();
        }
        return Optional.empty();
    }

    public Long save(String groupName, String description) {
        Map<String, Object> result = addMuscleGroupCall.execute(
                Map.of("p_group_name", groupName, "p_description", description == null ? "" : description)
        );
        Boolean success = (Boolean) result.get("p_success");
        if (Boolean.TRUE.equals(success)) {
            Number newGroupId = (Number) result.get("p_new_group_id");
            if (newGroupId != null) {
                return newGroupId.longValue();
            }
            throw new OperationFailedException("Procedura dodawania grupy nie zwróciła ID.");
        }
        throw new OperationFailedException("Nie udało się dodać grupy mięśniowej.");
    }

    public boolean update(Long id, String groupName, String description) {
        Map<String, Object> result = updateMuscleGroupCall.execute(
                Map.of("p_group_id", id, "p_group_name", groupName, "p_description", description == null ? "" : description)
        );
        return Boolean.TRUE.equals(result.get("p_success"));
    }

    public boolean deleteById(Long id) {
        Map<String, Object> result = deleteMuscleGroupCall.execute(Map.of("p_group_id", id));
        return Boolean.TRUE.equals(result.get("p_success"));
    }

    private static class MuscleGroupRowMapper implements RowMapper<MuscleGroupDto> {
        @Override
        public MuscleGroupDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new MuscleGroupDto(
                    rs.getLong("group_id"),
                    rs.getString("group_name"),
                    rs.getString("description")
            );
        }
    }
}