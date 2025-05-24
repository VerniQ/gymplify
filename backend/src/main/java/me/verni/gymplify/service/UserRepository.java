package me.verni.gymplify.service; // lub .repository

import lombok.RequiredArgsConstructor;
import me.verni.gymplify.dto.User; // Twoje DTO użytkownika
import me.verni.gymplify.util.UserRowMapper; // Twój UserRowMapper
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
        jdbcTemplate.update("CALL add_user(?, ?, ?, ?)", username, passwordHash, email, role);
    }

    public boolean deleteUser(Long userId) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("prc_delete_user")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        Map<String, Object> result = call.execute(Map.of("p_user_id", userId));
        return Boolean.TRUE.equals(result.get("p_success"));
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
}