package me.verni.gymplify.repository;

import me.verni.gymplify.dto.User;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.util.UserRowMapper;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class UserRepository {

    private static final Logger log = LoggerFactory.getLogger(UserRepository.class);
    private final JdbcTemplate jdbcTemplate;
    private final SimpleJdbcCall addUserCall;
    private final SimpleJdbcCall deleteUserCall;
    private final SimpleJdbcCall getUserByEmailFuncCall;
    private final SimpleJdbcCall getAllUsersCall;
    private final SimpleJdbcCall getUserByIdCall;
    private final SimpleJdbcCall updateUserRoleCall;
    private final SimpleJdbcCall updateUserDetailsCall;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        UserRowMapper userRowMapper = new UserRowMapper();

        this.addUserCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_USER_MGMT")
                .withProcedureName("AddUser")
                .declareParameters(
                        new SqlParameter("p_username", Types.VARCHAR),
                        new SqlParameter("p_password_hash", Types.VARCHAR),
                        new SqlParameter("p_email", Types.VARCHAR),
                        new SqlParameter("p_role", Types.VARCHAR),
                        new SqlOutParameter("p_user_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.deleteUserCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_USER_MGMT")
                .withProcedureName("DeleteUser")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.getUserByEmailFuncCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_USER_MGMT")
                .withFunctionName("GetUserByEmailFunc")
                .returningResultSet("return", userRowMapper);

        this.getAllUsersCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_USER_MGMT")
                .withProcedureName("GetAllUsers")
                .declareParameters(
                        new SqlOutParameter("p_users_cursor", OracleTypes.CURSOR, userRowMapper),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.getUserByIdCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_USER_MGMT")
                .withProcedureName("GetUserById")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlOutParameter("p_user_cursor", OracleTypes.CURSOR, userRowMapper),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.updateUserDetailsCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_USER_MGMT")
                .withProcedureName("UpdateUserDetails")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlParameter("p_username", Types.VARCHAR),
                        new SqlParameter("p_email", Types.VARCHAR),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.updateUserRoleCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_USER_MGMT")
                .withProcedureName("UpdateUserRole")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlParameter("p_new_role", Types.VARCHAR),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
    }

    private boolean checkSuccessFlag(Map<String, Object> result, String procedureName) {
        Object successObj = result.get("p_success");
        if (successObj == null) {
            log.warn("Procedura {} z pakietu PKG_USER_MGMT mogła nie zwrócić flagi p_success.", procedureName);
            return false;
        }
        if (successObj instanceof Boolean) {
            return (Boolean) successObj;
        }
        if (successObj instanceof Number) {
            return ((Number) successObj).intValue() != 0;
        }
        log.error("Procedura {} z pakietu PKG_USER_MGMT zwróciła nieoczekiwany typ dla p_success: {}", procedureName, successObj.getClass().getName());
        throw new OperationFailedException("Procedura " + procedureName + " zwróciła nieprawidłowy status powodzenia.");
    }

    public Long createUser(String username, String passwordHash, String email, String role) {
        Map<String, Object> params = new HashMap<>();
        params.put("p_username", username);
        params.put("p_password_hash", passwordHash);
        params.put("p_email", email);
        params.put("p_role", role.toUpperCase());
        try {
            Map<String, Object> result = addUserCall.execute(params);
            if (checkSuccessFlag(result, "AddUser")) {
                Object userIdObj = result.get("p_user_id");
                if (userIdObj instanceof BigDecimal) {
                    return ((BigDecimal) userIdObj).longValue();
                } else if (userIdObj instanceof Number) {
                    return ((Number) userIdObj).longValue();
                }
                log.error("Procedura AddUser z PKG_USER_MGMT zwróciła sukces, ale nieprawidłowe ID użytkownika.");
                throw new OperationFailedException("Procedura AddUser nie zwróciła ID użytkownika.");
            } else {
                log.warn("Procedura AddUser z PKG_USER_MGMT zwróciła p_success=false.");
                throw new OperationFailedException("Nie udało się utworzyć użytkownika (procedura PL/SQL zgłosiła błąd).");
            }
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania AddUser z PKG_USER_MGMT", e);
            throw new OperationFailedException("Błąd dostępu do danych podczas tworzenia użytkownika: " + e.getMessage(), e);
        }
    }

    public boolean deleteUser(Long userId) {
        try {
            Map<String, Object> result = deleteUserCall.execute(Map.of("p_user_id", userId));
            boolean success = checkSuccessFlag(result, "DeleteUser");
            if (!success) {
                log.warn("Procedura DeleteUser z PKG_USER_MGMT zwróciła p_success=false dla ID: {}", userId);
            }
            return success;
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania DeleteUser z PKG_USER_MGMT dla ID: {}", userId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas usuwania użytkownika: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<User> findUserDetailsByEmail(String email) {
        Map<String, Object> params = Map.of("p_email", email);
        try {
            List<User> users = (List<User>) getUserByEmailFuncCall.executeFunction(List.class, params);
            if (users != null && !users.isEmpty()) {
                return Optional.of(users.get(0));
            }
            return Optional.empty();
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetUserByEmailFunc z PKG_USER_MGMT dla email: {}", email, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas wyszukiwania użytkownika po emailu: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<User> findAllUsers() {
        try {
            Map<String, Object> result = getAllUsersCall.execute();
            if (checkSuccessFlag(result, "GetAllUsers")) {
                List<User> users = (List<User>) result.get("p_users_cursor");
                return users != null ? users : List.of();
            } else {
                log.warn("Procedura GetAllUsers z PKG_USER_MGMT zwróciła p_success=false.");
                throw new OperationFailedException("Nie udało się pobrać wszystkich użytkowników (procedura PL/SQL zgłosiła błąd).");
            }
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetAllUsers z PKG_USER_MGMT", e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania użytkowników: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<User> findUserById(Long userId) {
        Map<String, Object> params = Map.of("p_user_id", userId);
        try {
            Map<String, Object> result = getUserByIdCall.execute(params);
            if (checkSuccessFlag(result, "GetUserById")) {
                List<User> users = (List<User>) result.get("p_user_cursor");
                if (users != null && !users.isEmpty()) {
                    return Optional.of(users.get(0));
                }
            }
            log.info("Procedura GetUserById z PKG_USER_MGMT nie znalazła użytkownika o ID {} lub zwróciła p_success=false.", userId);
            return Optional.empty();
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetUserById z PKG_USER_MGMT dla ID: {}", userId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania użytkownika o ID " + userId + ": " + e.getMessage(), e);
        }
    }

    public boolean updateUserDetails(Long userId, String username, String email) {
        Map<String, Object> params = new HashMap<>();
        params.put("p_user_id", userId);
        params.put("p_username", username);
        params.put("p_email", email);
        try {
            Map<String, Object> result = updateUserDetailsCall.execute(params);
            boolean success = checkSuccessFlag(result, "UpdateUserDetails");
            if(!success) {
                log.warn("Procedura UpdateUserDetails z PKG_USER_MGMT zwróciła p_success=false dla ID: {}", userId);
            }
            return success;
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania UpdateUserDetails z PKG_USER_MGMT dla ID: {}", userId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas aktualizacji danych użytkownika: " + e.getMessage(), e);
        }
    }

    public boolean updateUserRole(Long userId, String newRole) {
        Map<String, Object> params = Map.of(
                "p_user_id", userId,
                "p_new_role", newRole.toUpperCase()
        );
        try {
            Map<String, Object> result = updateUserRoleCall.execute(params);
            boolean success = checkSuccessFlag(result, "UpdateUserRole");
            if (!success) {
                log.warn("Procedura UpdateUserRole z PKG_USER_MGMT zwróciła p_success=false dla ID: {}", userId);
            }
            return success;
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania UpdateUserRole z PKG_USER_MGMT dla ID: {}", userId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas aktualizacji roli użytkownika: " + e.getMessage(), e);
        }
    }
}