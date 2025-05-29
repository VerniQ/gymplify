package me.verni.gymplify.repository;

import me.verni.gymplify.util.TrainerSessionSqlRecord;
import me.verni.gymplify.dto.TrainerSessionDto;
import me.verni.gymplify.exception.OperationFailedException;
import oracle.jdbc.OracleCallableStatement;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.*;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class TrainerSessionRepository {

    private static final Logger log = LoggerFactory.getLogger(TrainerSessionRepository.class);
    private final JdbcTemplate jdbcTemplate;

    private final SimpleJdbcCall createTrainerSessionCall;
    private final SimpleJdbcCall deleteTrainerSessionCall;
    private final SimpleJdbcCall updateTrainerSessionCall;

    @Autowired
    public TrainerSessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;

        this.createTrainerSessionCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_SESSION_MGMT")
                .withProcedureName("CreateTrainerSession")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlParameter("p_session_date", Types.DATE),
                        new SqlParameter("p_start_time", Types.TIMESTAMP),
                        new SqlParameter("p_end_time", Types.TIMESTAMP),
                        new SqlOutParameter("p_schedule_id", Types.NUMERIC)
                ).withoutProcedureColumnMetaDataAccess();

        this.deleteTrainerSessionCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_SESSION_MGMT")
                .withProcedureName("DeleteTrainerSession")
                .declareParameters(
                        new SqlParameter("p_schedule_id", Types.NUMERIC)
                ).withoutProcedureColumnMetaDataAccess();

        this.updateTrainerSessionCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_SESSION_MGMT")
                .withProcedureName("UpdateTrainerSession")
                .declareParameters(
                        new SqlParameter("p_schedule_id", Types.NUMERIC),
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlParameter("p_session_date", Types.DATE),
                        new SqlParameter("p_start_time", Types.TIMESTAMP),
                        new SqlParameter("p_end_time", Types.TIMESTAMP)
                ).withoutProcedureColumnMetaDataAccess();
    }

    private String extractOracleErrorMessage(DataAccessException e) {
        if (e.getCause() instanceof SQLException) {
            SQLException sqlEx = (SQLException) e.getCause();
            if (sqlEx.getErrorCode() >= 20000 && sqlEx.getErrorCode() <= 20999 && sqlEx.getMessage() != null) {
                return sqlEx.getMessage().split("\n")[0].replace("ORA-" + sqlEx.getErrorCode() + ": ", "");
            }
            // Dodaj obsługę ORA-17003 specyficznie
            if (sqlEx.getErrorCode() == 17003) {
                return "Niepoprawny indeks kolumny podczas wywołania PL/SQL. Sprawdź logi serwera.";
            }
        }
        return "Błąd operacji na bazie danych: " + e.getMessage();
    }

    public Long create(Long trainerId, LocalDate sessionDate, LocalDateTime startTime, LocalDateTime endTime) {
        try {
            Map<String, Object> params = Map.of(
                    "p_trainer_id", trainerId,
                    "p_session_date", Date.valueOf(sessionDate),
                    "p_start_time", Timestamp.valueOf(startTime),
                    "p_end_time", Timestamp.valueOf(endTime)
            );
            Map<String, Object> result = createTrainerSessionCall.execute(params);
            Object scheduleIdObj = result.get("p_schedule_id");
            if (scheduleIdObj instanceof BigDecimal) {
                return ((BigDecimal) scheduleIdObj).longValue();
            } else if (scheduleIdObj instanceof Number) {
                return ((Number) scheduleIdObj).longValue();
            }
            log.error("Procedura CreateTrainerSession nie zwróciła poprawnego ID sesji.");
            throw new OperationFailedException("Tworzenie sesji trenera zakończyło się sukcesem, ale nie zwrócono ID.");
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas tworzenia sesji trenera: {}", e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public void deleteById(Long scheduleId) {
        try {
            deleteTrainerSessionCall.execute(Map.of("p_schedule_id", scheduleId));
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas usuwania sesji trenera ID {}: {}", scheduleId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public void update(Long scheduleId, Long trainerId, LocalDate sessionDate, LocalDateTime startTime, LocalDateTime endTime) {
        try {
            Map<String, Object> params = Map.of(
                    "p_schedule_id", scheduleId,
                    "p_trainer_id", trainerId,
                    "p_session_date", Date.valueOf(sessionDate),
                    "p_start_time", Timestamp.valueOf(startTime),
                    "p_end_time", Timestamp.valueOf(endTime)
            );
            updateTrainerSessionCall.execute(params);
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException podczas aktualizacji sesji trenera ID {}: {}", scheduleId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public Optional<TrainerSessionDto> findById(Long scheduleId) {
        final String sql = "{? = call PKG_TRAINER_SESSION_MGMT.GetTrainerSessionById(?)}";
        try {
            TrainerSessionSqlRecord record = jdbcTemplate.execute(
                    (Connection con) -> {
                        Map<String, Class<?>> typeMap = con.getTypeMap();
                        if (!typeMap.containsKey(TrainerSessionSqlRecord.SQL_TYPE_NAME)) {
                            typeMap.put(TrainerSessionSqlRecord.SQL_TYPE_NAME, TrainerSessionSqlRecord.class);
                        }
                        CallableStatement cs = con.prepareCall(sql);
                        if (cs.isWrapperFor(OracleCallableStatement.class)) {
                            OracleCallableStatement ocs = cs.unwrap(OracleCallableStatement.class);
                            ocs.registerOutParameter(1, OracleTypes.STRUCT, TrainerSessionSqlRecord.SQL_TYPE_NAME);
                        } else {
                            cs.registerOutParameter(1, Types.STRUCT, TrainerSessionSqlRecord.SQL_TYPE_NAME);
                        }
                        cs.setLong(2, scheduleId);
                        return cs;
                    },
                    (CallableStatement cs) -> {
                        cs.execute();
                        Object result = cs.getObject(1);
                        if (result instanceof TrainerSessionSqlRecord) {
                            return (TrainerSessionSqlRecord) result;
                        } else if (result instanceof java.sql.Struct && result != null) {
                            java.sql.Struct struct = (java.sql.Struct) result;
                            Object[] attrs = struct.getAttributes();
                            TrainerSessionSqlRecord tempRecord = new TrainerSessionSqlRecord();
                            tempRecord.setScheduleId(((Number) attrs[0]).longValue());
                            tempRecord.setTrainerId(((Number) attrs[1]).longValue());
                            tempRecord.setTrainerName((String) attrs[2]);
                            tempRecord.setTrainerSurname((String) attrs[3]);
                            tempRecord.setSessionDate((Date) attrs[4]);
                            tempRecord.setStartTime((Timestamp) attrs[5]);
                            tempRecord.setEndTime((Timestamp) attrs[6]);
                            return tempRecord;
                        }
                        return null;
                    }
            );
            return Optional.ofNullable(record).map(TrainerSessionSqlRecord::toDto);
        } catch (DataAccessException e) {
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                if (sqlEx.getErrorCode() == 20502) { // NO_DATA_FOUND
                    return Optional.empty();
                }
            }
            log.error("Błąd DataAccessException podczas wywoływania funkcji GetTrainerSessionById dla ID {}: {}", scheduleId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public List<TrainerSessionDto> findByTrainerId(Long trainerId, LocalDate fromDate, LocalDate toDate) {
        // ZAWSZE przekazuj wszystkie 3 parametry. Funkcja PL/SQL ma wartości domyślne NULL.
        final String sql = "{? = call PKG_TRAINER_SESSION_MGMT.GetTrainerSessionsByTrainer(?, ?, ?)}";
        log.debug("Executing SQL for findByTrainerId: {}", sql);

        try {
            List<TrainerSessionSqlRecord> records = jdbcTemplate.execute(
                    (Connection con) -> {
                        Map<String, Class<?>> typeMap = con.getTypeMap();
                        if (!typeMap.containsKey(TrainerSessionSqlRecord.SQL_TYPE_NAME)) {
                            typeMap.put(TrainerSessionSqlRecord.SQL_TYPE_NAME, TrainerSessionSqlRecord.class);
                        }
                        CallableStatement cs = con.prepareCall(sql);
                        if (cs.isWrapperFor(OracleCallableStatement.class)) {
                            OracleCallableStatement ocs = cs.unwrap(OracleCallableStatement.class);
                            ocs.registerOutParameter(1, OracleTypes.ARRAY, "PKG_TRAINER_SESSION_MGMT.TY_TRAINER_SESSION_TABLE");
                        } else {
                            cs.registerOutParameter(1, Types.ARRAY, "PKG_TRAINER_SESSION_MGMT.TY_TRAINER_SESSION_TABLE");
                        }

                        cs.setLong(2, trainerId);

                        if (fromDate != null) {
                            cs.setDate(3, Date.valueOf(fromDate));
                        } else {
                            cs.setNull(3, Types.DATE);
                        }

                        if (toDate != null) {
                            cs.setDate(4, Date.valueOf(toDate));
                        } else {
                            cs.setNull(4, Types.DATE);
                        }
                        return cs;
                    },
                    this::processSqlArray
            );
            return records.stream().map(TrainerSessionSqlRecord::toDto).collect(Collectors.toList());
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException w findByTrainerId dla trenera {}: {}", trainerId, e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    public List<TrainerSessionDto> findAll(LocalDate fromDate, LocalDate toDate) {
        // ZAWSZE przekazuj wszystkie 2 parametry. Funkcja PL/SQL ma wartości domyślne NULL.
        final String sql = "{? = call PKG_TRAINER_SESSION_MGMT.ListAllTrainerSessions(?, ?)}";
        log.debug("Executing SQL for findAll: {}", sql);

        try {
            List<TrainerSessionSqlRecord> records = jdbcTemplate.execute(
                    (Connection con) -> {
                        Map<String, Class<?>> typeMap = con.getTypeMap();
                        if (!typeMap.containsKey(TrainerSessionSqlRecord.SQL_TYPE_NAME)) {
                            typeMap.put(TrainerSessionSqlRecord.SQL_TYPE_NAME, TrainerSessionSqlRecord.class);
                        }
                        CallableStatement cs = con.prepareCall(sql);
                        if (cs.isWrapperFor(OracleCallableStatement.class)) {
                            OracleCallableStatement ocs = cs.unwrap(OracleCallableStatement.class);
                            ocs.registerOutParameter(1, OracleTypes.ARRAY, "PKG_TRAINER_SESSION_MGMT.TY_TRAINER_SESSION_TABLE");
                        } else {
                            cs.registerOutParameter(1, Types.ARRAY, "PKG_TRAINER_SESSION_MGMT.TY_TRAINER_SESSION_TABLE");
                        }

                        if (fromDate != null) {
                            cs.setDate(2, Date.valueOf(fromDate));
                        } else {
                            cs.setNull(2, Types.DATE);
                        }

                        if (toDate != null) {
                            cs.setDate(3, Date.valueOf(toDate));
                        } else {
                            cs.setNull(3, Types.DATE);
                        }
                        return cs;
                    },
                    this::processSqlArray
            );
            return records.stream().map(TrainerSessionSqlRecord::toDto).collect(Collectors.toList());
        } catch (DataAccessException e) {
            log.error("Błąd DataAccessException w findAll: {}", e.getMessage(), e);
            throw new OperationFailedException(extractOracleErrorMessage(e), e);
        }
    }

    // Metoda pomocnicza do przetwarzania wyniku typu ARRAY
    private List<TrainerSessionSqlRecord> processSqlArray(CallableStatement cs) throws SQLException {
        cs.execute();
        java.sql.Array sqlArray = cs.getArray(1);
        List<TrainerSessionSqlRecord> resultList = new ArrayList<>();
        if (sqlArray != null) {
            Object[] arrayElements = (Object[]) sqlArray.getArray();
            for (Object element : arrayElements) {
                if (element instanceof TrainerSessionSqlRecord) {
                    resultList.add((TrainerSessionSqlRecord) element);
                } else if (element instanceof java.sql.Struct) {
                    java.sql.Struct struct = (java.sql.Struct) element;
                    Object[] attrs = struct.getAttributes();
                    TrainerSessionSqlRecord tempRecord = new TrainerSessionSqlRecord();
                    tempRecord.setScheduleId(((Number) attrs[0]).longValue());
                    tempRecord.setTrainerId(((Number) attrs[1]).longValue());
                    tempRecord.setTrainerName((String) attrs[2]);
                    tempRecord.setTrainerSurname((String) attrs[3]);
                    tempRecord.setSessionDate((Date) attrs[4]);
                    tempRecord.setStartTime((Timestamp) attrs[5]);
                    tempRecord.setEndTime((Timestamp) attrs[6]);
                    resultList.add(tempRecord);
                }
            }
            sqlArray.free();
        }
        return resultList;
    }
}