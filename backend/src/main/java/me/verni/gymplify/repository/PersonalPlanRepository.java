package me.verni.gymplify.repository;

import me.verni.gymplify.dto.PersonalPlanDto;
import me.verni.gymplify.dto.UserInPersonalPlanDto;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.util.PersonalPlanSqlRecord;
import me.verni.gymplify.util.UserInPersonalPlanSqlRecord;
import oracle.jdbc.OracleCallableStatement;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class PersonalPlanRepository {

    private static final Logger log = LoggerFactory.getLogger(PersonalPlanRepository.class);
    private final JdbcTemplate jdbcTemplate;

    private final SimpleJdbcCall assignPlanToUserCall;
    private final SimpleJdbcCall unassignPersonalPlanByIdCall;
    private final SimpleJdbcCall unassignPlanFromUserCall;
    private final SimpleJdbcCall updatePersonalPlanAssignmentCall;

    @Autowired
    public PersonalPlanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;

        this.assignPlanToUserCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_PERSONAL_PLAN_MGMT")
                .withProcedureName("AssignPlanToUser")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlParameter("p_plan_id", Types.NUMERIC),
                        new SqlOutParameter("p_personal_plan_id", Types.NUMERIC)
                ).withoutProcedureColumnMetaDataAccess();

        this.unassignPersonalPlanByIdCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_PERSONAL_PLAN_MGMT")
                .withProcedureName("UnassignPersonalPlanById")
                .declareParameters(
                        new SqlParameter("p_personal_plan_id", Types.NUMERIC)
                ).withoutProcedureColumnMetaDataAccess();

        this.unassignPlanFromUserCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_PERSONAL_PLAN_MGMT")
                .withProcedureName("UnassignPlanFromUser")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlParameter("p_plan_id", Types.NUMERIC),
                        new SqlParameter("p_trainer_id", Types.NUMERIC)
                ).withoutProcedureColumnMetaDataAccess();

        this.updatePersonalPlanAssignmentCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_PERSONAL_PLAN_MGMT")
                .withProcedureName("UpdatePersonalPlanAssignment")
                .declareParameters(
                        new SqlParameter("p_personal_plan_id", Types.NUMERIC),
                        new SqlParameter("p_new_trainer_id", Types.NUMERIC),
                        new SqlParameter("p_new_plan_id", Types.NUMERIC)
                ).withoutProcedureColumnMetaDataAccess();
    }

    private String extractOracleErrorMessage(DataAccessException e) {
        if (e.getCause() instanceof SQLException) {
            SQLException sqlEx = (SQLException) e.getCause();
            if (sqlEx.getErrorCode() >= 20000 && sqlEx.getErrorCode() <= 20999 && sqlEx.getMessage() != null) {
                return sqlEx.getMessage().split("\n")[0].replace("ORA-" + sqlEx.getErrorCode() + ": ", "");
            }
            if (sqlEx.getErrorCode() == 17003) {
                return "Niepoprawny indeks kolumny podczas wywołania PL/SQL. Sprawdź logi serwera.";
            }
        }
        return "Błąd operacji na bazie danych: " + e.getMessage();
    }

    public Long assignPlanToUser(Long trainerId, Long userId, Long planId) {
        try {
            Map<String, Object> params = Map.of(
                    "p_trainer_id", trainerId,
                    "p_user_id", userId,
                    "p_plan_id", planId
            );
            Map<String, Object> result = assignPlanToUserCall.execute(params);
            Object personalPlanIdObj = result.get("p_personal_plan_id");
            if (personalPlanIdObj instanceof BigDecimal) {
                return ((BigDecimal) personalPlanIdObj).longValue();
            } else if (personalPlanIdObj instanceof Number) {
                return ((Number) personalPlanIdObj).longValue();
            }
            log.error("Procedura AssignPlanToUser nie zwróciła poprawnego ID.");
            throw new OperationFailedException("Przypisanie planu zakończyło się sukcesem, ale nie zwrócono ID.");
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas AssignPlanToUser: {}", e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public void unassignPersonalPlanById(Long personalPlanId) {
        try {
            unassignPersonalPlanByIdCall.execute(Map.of("p_personal_plan_id", personalPlanId));
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas UnassignPersonalPlanById dla ID {}: {}", personalPlanId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public void unassignPlanFromUser(Long userId, Long planId, Long trainerId) {
        try {
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("p_user_id", userId);
            params.put("p_plan_id", planId);
            params.put("p_trainer_id", trainerId);

            unassignPlanFromUserCall.execute(params);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas UnassignPlanFromUser dla user ID {}, plan ID {}, trainer ID {}: {}", userId, planId, trainerId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }


    public void updatePersonalPlanAssignment(Long personalPlanId, Long newTrainerId, Long newPlanId) {
        try {
            Map<String, Object> params = Map.of(
                    "p_personal_plan_id", personalPlanId,
                    "p_new_trainer_id", newTrainerId,
                    "p_new_plan_id", newPlanId
            );
            updatePersonalPlanAssignmentCall.execute(params);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas UpdatePersonalPlanAssignment dla ID {}: {}", personalPlanId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public Optional<PersonalPlanDto> getPersonalPlanById(Long personalPlanId) {
        final String sql = "{? = call PKG_PERSONAL_PLAN_MGMT.GetPersonalPlanById(?)}";
        try {
            PersonalPlanSqlRecord record = jdbcTemplate.execute(
                    (Connection con) -> {
                        Map<String, Class<?>> typeMap = con.getTypeMap();
                        if (!typeMap.containsKey(PersonalPlanSqlRecord.SQL_TYPE_NAME)) {
                            typeMap.put(PersonalPlanSqlRecord.SQL_TYPE_NAME, PersonalPlanSqlRecord.class);
                        }
                        CallableStatement cs = con.prepareCall(sql);
                        if (cs.isWrapperFor(OracleCallableStatement.class)) {
                            OracleCallableStatement ocs = cs.unwrap(OracleCallableStatement.class);
                            ocs.registerOutParameter(1, OracleTypes.STRUCT, PersonalPlanSqlRecord.SQL_TYPE_NAME);
                        } else {
                            cs.registerOutParameter(1, Types.STRUCT, PersonalPlanSqlRecord.SQL_TYPE_NAME);
                        }
                        cs.setLong(2, personalPlanId);
                        return cs;
                    },
                    (CallableStatement cs) -> {
                        cs.execute();
                        Object result = cs.getObject(1);
                        if (result instanceof PersonalPlanSqlRecord) {
                            return (PersonalPlanSqlRecord) result;
                        }
                        return null;
                    }
            );
            return Optional.ofNullable(record).map(PersonalPlanSqlRecord::toDto);
        } catch (DataAccessException e) {
            if (e.getCause() instanceof SQLException && ((SQLException)e.getCause()).getErrorCode() == 20401) {
                return Optional.empty();
            }
            log.error("Błąd DataAccessException podczas GetPersonalPlanById dla ID {}: {}", personalPlanId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public List<PersonalPlanDto> getPersonalPlansForUser(Long userId) {
        final String sql = "{? = call PKG_PERSONAL_PLAN_MGMT.GetPersonalPlansForUser(?)}";
        try {
            List<PersonalPlanSqlRecord> records = jdbcTemplate.execute(
                    (Connection con) -> {
                        Map<String, Class<?>> typeMap = con.getTypeMap();
                        if (!typeMap.containsKey(PersonalPlanSqlRecord.SQL_TYPE_NAME)) {
                            typeMap.put(PersonalPlanSqlRecord.SQL_TYPE_NAME, PersonalPlanSqlRecord.class);
                        }
                        CallableStatement cs = con.prepareCall(sql);
                        if (cs.isWrapperFor(OracleCallableStatement.class)) {
                            OracleCallableStatement ocs = cs.unwrap(OracleCallableStatement.class);
                            ocs.registerOutParameter(1, OracleTypes.ARRAY, "PKG_PERSONAL_PLAN_MGMT.TY_PERSONAL_PLAN_TABLE");
                        } else {
                            cs.registerOutParameter(1, Types.ARRAY, "PKG_PERSONAL_PLAN_MGMT.TY_PERSONAL_PLAN_TABLE");
                        }
                        cs.setLong(2, userId);
                        return cs;
                    },
                    (CallableStatement cs) -> processSqlArray(cs, PersonalPlanSqlRecord.class)
            );
            return records.stream().map(PersonalPlanSqlRecord::toDto).collect(Collectors.toList());
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException w GetPersonalPlansForUser dla User ID {}: {}", userId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }


    public List<UserInPersonalPlanDto> getUsersForPersonalPlanByPlanId(Long planId) {
        final String sql = "{? = call PKG_PERSONAL_PLAN_MGMT.GetUsersForPersonalPlanByPlanId(?)}";
        try {
            List<UserInPersonalPlanSqlRecord> records = jdbcTemplate.execute(
                    (Connection con) -> {
                        Map<String, Class<?>> typeMap = con.getTypeMap();
                        if (!typeMap.containsKey(UserInPersonalPlanSqlRecord.SQL_TYPE_NAME)) {
                            typeMap.put(UserInPersonalPlanSqlRecord.SQL_TYPE_NAME, UserInPersonalPlanSqlRecord.class);
                        }
                        CallableStatement cs = con.prepareCall(sql);
                        if (cs.isWrapperFor(OracleCallableStatement.class)) {
                            OracleCallableStatement ocs = cs.unwrap(OracleCallableStatement.class);
                            ocs.registerOutParameter(1, OracleTypes.ARRAY, "PKG_PERSONAL_PLAN_MGMT.TY_USER_IN_PERSONAL_PLAN_TABLE");
                        } else {
                            cs.registerOutParameter(1, Types.ARRAY, "PKG_PERSONAL_PLAN_MGMT.TY_USER_IN_PERSONAL_PLAN_TABLE");
                        }
                        cs.setLong(2, planId);
                        return cs;
                    },
                    (CallableStatement cs) -> processSqlArray(cs, UserInPersonalPlanSqlRecord.class)
            );
            return records.stream().map(UserInPersonalPlanSqlRecord::toDto).collect(Collectors.toList());
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException w GetUsersForPersonalPlanByPlanId dla Plan ID {}: {}", planId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public List<PersonalPlanDto> listAllPersonalPlans() {
        final String sql = "{? = call PKG_PERSONAL_PLAN_MGMT.ListAllPersonalPlans()}";
        try {
            List<PersonalPlanSqlRecord> records = jdbcTemplate.execute(
                    (Connection con) -> {
                        Map<String, Class<?>> typeMap = con.getTypeMap();
                        if (!typeMap.containsKey(PersonalPlanSqlRecord.SQL_TYPE_NAME)) {
                            typeMap.put(PersonalPlanSqlRecord.SQL_TYPE_NAME, PersonalPlanSqlRecord.class);
                        }
                        CallableStatement cs = con.prepareCall(sql);
                        if (cs.isWrapperFor(OracleCallableStatement.class)) {
                            OracleCallableStatement ocs = cs.unwrap(OracleCallableStatement.class);
                            ocs.registerOutParameter(1, OracleTypes.ARRAY, "PKG_PERSONAL_PLAN_MGMT.TY_PERSONAL_PLAN_TABLE");
                        } else {
                            cs.registerOutParameter(1, Types.ARRAY, "PKG_PERSONAL_PLAN_MGMT.TY_PERSONAL_PLAN_TABLE");
                        }
                        return cs;
                    },
                    (CallableStatement cs) -> processSqlArray(cs, PersonalPlanSqlRecord.class)
            );
            return records.stream().map(PersonalPlanSqlRecord::toDto).collect(Collectors.toList());
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException w ListAllPersonalPlans: {}", e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    private <T extends SQLData> List<T> processSqlArray(CallableStatement cs, Class<T> elementType) throws SQLException {
        cs.execute();
        java.sql.Array sqlArray = cs.getArray(1);
        List<T> resultList = new ArrayList<>();
        if (sqlArray != null) {
            Object[] arrayElements = (Object[]) sqlArray.getArray();
            for (Object element : arrayElements) {
                if (elementType.isInstance(element)) {
                    resultList.add(elementType.cast(element));
                } else if (element instanceof java.sql.Struct) {
                    log.warn("Encountered java.sql.Struct, but expected {}. Element: {}", elementType.getName(), element);
                }
            }
            sqlArray.free();
        }
        return resultList;
    }
}