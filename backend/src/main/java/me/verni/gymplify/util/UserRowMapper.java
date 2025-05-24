package me.verni.gymplify.util;

import me.verni.gymplify.dto.User;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UserRowMapper implements RowMapper<User> {
    @Override
    public User mapRow(ResultSet rs, int rowNum) throws SQLException {
        User user = new User();
        user.setUserId(rs.getLong("user_id")); // Upewnij się, że nazwy kolumn są poprawne
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        user.setPasswordHash(rs.getString("password_hash")); // Zazwyczaj hasła nie pobiera się w każdym zapytaniu
        user.setRole(RoleType.valueOf(rs.getString("role")));
        return user;
    }
}
