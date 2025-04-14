package me.verni.gymplify.service;

import lombok.RequiredArgsConstructor;
import me.verni.gymplify.dto.User;
import me.verni.gymplify.util.UserRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Types;
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
                        new org.springframework.jdbc.core.SqlParameter("p_user_id", Types.NUMERIC),
                        new org.springframework.jdbc.core.SqlOutParameter("p_success", Types.BOOLEAN)
                );

        Map<String, Object> result = call.execute(Map.of("p_user_id", userId));
        return Boolean.TRUE.equals(result.get("p_success"));
    }
}
