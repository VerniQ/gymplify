package me.verni.gymplify.repository;

import lombok.RequiredArgsConstructor;
import me.verni.gymplify.dto.User;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.util.UserRowMapper;
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

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public void createUser(String username, String passwordHash, String email, String role) {
        jdbcTemplate.update("CALL add_user(?, ?, ?, ?)", username, passwordHash, email, role.toUpperCase());
    }

    public boolean deleteUser(Long userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_delete_user")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        Map<String, Object> result = call.execute(Map.of("p_user_id", userId));
        Boolean success = (Boolean) result.get("p_success");
        return Boolean.TRUE.equals(success);
    }

    @SuppressWarnings("unchecked")
    public Optional<User> findUserDetailsByEmail(String email) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withFunctionName("get_user_by_email")
                .returningResultSet("c_user", new UserRowMapper());

        Map<String, Object> params = Map.of("p_email", email);
        Map<String, Object> result = call.execute(params);

        List<User> users = (List<User>) result.get("c_user");

        if (users != null && !users.isEmpty()) {
            return Optional.of(users.get(0));
        }
        return Optional.empty();
    }

    @SuppressWarnings("unchecked")
    public List<User> findAllUsers() {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_get_all_users")
                .declareParameters(
                        new SqlOutParameter("p_users_cursor", OracleTypes.CURSOR, new UserRowMapper()),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
        Map<String, Object> result = call.execute();
        Boolean success = (Boolean) result.get("p_success");

        if (Boolean.TRUE.equals(success)) {
            List<User> users = (List<User>) result.get("p_users_cursor");
            return users != null ? users : List.of();
        }
        throw new OperationFailedException("Failed to retrieve all users (prc_get_all_users reported failure).");
    }

    @SuppressWarnings("unchecked")
    public Optional<User> findUserById(Long userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_get_user_by_id")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlOutParameter("p_user_cursor", OracleTypes.CURSOR, new UserRowMapper()),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        Map<String, Object> params = Map.of("p_user_id", userId);
        Map<String, Object> result = call.execute(params);
        Boolean success = (Boolean) result.get("p_success");

        if (Boolean.TRUE.equals(success)) {
            List<User> users = (List<User>) result.get("p_user_cursor");
            if (users != null && !users.isEmpty()) {
                return Optional.of(users.get(0));
            }
        }
        return Optional.empty();
    }

    public boolean updateUserRole(Long userId, String newRole) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_update_user_role")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlParameter("p_new_role", Types.VARCHAR),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
        Map<String, Object> params = Map.of(
                "p_user_id", userId,
                "p_new_role", newRole.toUpperCase()
        );
        Map<String, Object> result = call.execute(params);
        Boolean success = (Boolean) result.get("p_success");
        return Boolean.TRUE.equals(success);
    }
}