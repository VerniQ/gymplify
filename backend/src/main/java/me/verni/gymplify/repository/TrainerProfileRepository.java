package me.verni.gymplify.repository;

import me.verni.gymplify.dto.TrainerAdminViewDto;
import me.verni.gymplify.dto.TrainerSessionDto;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.util.TrainerAdminViewRowMapper;
import me.verni.gymplify.util.TrainerSessionRowMapper;
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
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class TrainerProfileRepository {

    private static final Logger log = LoggerFactory.getLogger(TrainerProfileRepository.class);
    private final JdbcTemplate jdbcTemplate;

    private final SimpleJdbcCall createTrainerCall;
    private final SimpleJdbcCall findAllTrainersCall;
    private final SimpleJdbcCall findTrainerByIdCall;
    private final SimpleJdbcCall updateTrainerCall;
    private final SimpleJdbcCall deleteTrainerCall;
    private final SimpleJdbcCall findTrainersBySpecializationCall;
    private final SimpleJdbcCall getTrainerCountCall;
    private final SimpleJdbcCall getTrainerSessionsCall;

    public TrainerProfileRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        TrainerAdminViewRowMapper trainerAdminViewRowMapper = new TrainerAdminViewRowMapper();
        TrainerSessionRowMapper trainerSessionRowMapper = new TrainerSessionRowMapper();

        this.createTrainerCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("CreateTrainer")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.NUMERIC),
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_surname", Types.VARCHAR),
                        new SqlParameter("p_specialization", Types.VARCHAR),
                        new SqlParameter("p_contact", Types.VARCHAR),
                        new SqlOutParameter("p_trainer_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.findAllTrainersCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("GetAllTrainers")
                .declareParameters(
                        new SqlOutParameter("p_trainers", OracleTypes.CURSOR, trainerAdminViewRowMapper),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.findTrainerByIdCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("GetTrainerDetails")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlOutParameter("p_trainer_data", OracleTypes.CURSOR, trainerAdminViewRowMapper),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.updateTrainerCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("UpdateTrainer")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_surname", Types.VARCHAR),
                        new SqlParameter("p_specialization", Types.VARCHAR),
                        new SqlParameter("p_contact", Types.VARCHAR),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.deleteTrainerCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("DeleteTrainer")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );

        this.findTrainersBySpecializationCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("FindTrainersBySpecialization")
                .declareParameters(
                        new SqlParameter("p_specialization", Types.VARCHAR),
                        new SqlOutParameter("p_trainers", OracleTypes.CURSOR, trainerAdminViewRowMapper)
                );

        this.getTrainerCountCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("GetTrainerCount")
                .declareParameters(
                        new SqlOutParameter("p_count", Types.NUMERIC)
                );

        this.getTrainerSessionsCall = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("PKG_TRAINER_MGMT")
                .withProcedureName("GetTrainerSessions")
                .declareParameters(
                        new SqlParameter("p_trainer_id", Types.NUMERIC),
                        new SqlParameter("p_from_date", Types.DATE),
                        new SqlParameter("p_to_date", Types.DATE),
                        new SqlOutParameter("p_sessions", OracleTypes.CURSOR, trainerSessionRowMapper),
                        new SqlOutParameter("p_success", Types.BOOLEAN)
                );
    }

    private boolean checkSuccessFlag(Map<String, Object> result, String procedureName) {
        Object successObj = result.get("p_success");
        if (successObj == null) {
            log.warn("Procedura {} z pakietu PKG_TRAINER_MGMT mogła nie zwrócić flagi p_success lub nie była ona oczekiwana.", procedureName);
            return true;
        }
        if (successObj instanceof Boolean) {
            return (Boolean) successObj;
        }
        if (successObj instanceof Number) {
            return ((Number) successObj).intValue() != 0;
        }
        log.error("Procedura {} z pakietu PKG_TRAINER_MGMT zwróciła nieoczekiwany typ dla p_success: {}", procedureName, successObj.getClass().getName());
        throw new OperationFailedException("Procedura " + procedureName + " zwróciła nieprawidłowy status powodzenia.");
    }

    public Long createTrainerProfile(Long userId, String name, String surname, String specialization, String contact) {
        Map<String, Object> params = new HashMap<>();
        params.put("p_user_id", userId);
        params.put("p_name", name);
        params.put("p_surname", surname);
        params.put("p_specialization", specialization);
        params.put("p_contact", contact);

        try {
            Map<String, Object> result = createTrainerCall.execute(params);
            if (checkSuccessFlag(result, "CreateTrainer")) {
                Object trainerIdObj = result.get("p_trainer_id");
                if (trainerIdObj instanceof BigDecimal) {
                    return ((BigDecimal) trainerIdObj).longValue();
                } else if (trainerIdObj instanceof Number) {
                    return ((Number) trainerIdObj).longValue();
                }
                log.error("Procedura CreateTrainer z PKG_TRAINER_MGMT zwróciła sukces, ale nieprawidłowe ID trenera.");
                throw new OperationFailedException("Procedura CreateTrainer zwróciła sukces, ale nieprawidłowe ID trenera.");
            } else {
                log.warn("Procedura CreateTrainer z PKG_TRAINER_MGMT zwróciła p_success=false.");
                throw new OperationFailedException("Nie udało się utworzyć profilu trenera (procedura PL/SQL zgłosiła błąd).");
            }
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania CreateTrainer z PKG_TRAINER_MGMT", e);
            throw new OperationFailedException("Błąd dostępu do danych podczas tworzenia profilu trenera: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TrainerAdminViewDto> findAllTrainerProfiles() {
        try {
            Map<String, Object> result = findAllTrainersCall.execute();
            if (checkSuccessFlag(result, "GetAllTrainers")) {
                List<TrainerAdminViewDto> trainers = (List<TrainerAdminViewDto>) result.get("p_trainers");
                return trainers != null ? trainers : List.of();
            } else {
                log.warn("Procedura GetAllTrainers z PKG_TRAINER_MGMT zwróciła p_success=false.");
                throw new OperationFailedException("Nie udało się pobrać wszystkich profili trenerów (procedura PL/SQL zgłosiła błąd).");
            }
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetAllTrainers z PKG_TRAINER_MGMT", e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania profili trenerów: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<TrainerAdminViewDto> findTrainerProfileById(Long trainerId) {
        Map<String, Object> params = Map.of("p_trainer_id", trainerId);
        try {
            Map<String, Object> result = findTrainerByIdCall.execute(params);
            if (checkSuccessFlag(result, "GetTrainerDetails")) {
                List<TrainerAdminViewDto> trainers = (List<TrainerAdminViewDto>) result.get("p_trainer_data");
                if (trainers != null && !trainers.isEmpty()) {
                    return Optional.of(trainers.get(0));
                }
            }
            log.info("Procedura GetTrainerDetails z PKG_TRAINER_MGMT nie znalazła trenera o ID {} lub zwróciła p_success=false.", trainerId);
            return Optional.empty();
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetTrainerDetails z PKG_TRAINER_MGMT dla ID {}", trainerId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania profilu trenera o ID " + trainerId + ": " + e.getMessage(), e);
        }
    }

    public boolean updateTrainerProfile(Long trainerId, String name, String surname, String specialization, String contact) {
        Map<String, Object> params = new HashMap<>();
        params.put("p_trainer_id", trainerId);
        params.put("p_name", name);
        params.put("p_surname", surname);
        params.put("p_specialization", specialization);
        params.put("p_contact", contact);
        try {
            Map<String, Object> result = updateTrainerCall.execute(params);
            boolean success = checkSuccessFlag(result, "UpdateTrainer");
            if(!success) {
                log.warn("Procedura UpdateTrainer z PKG_TRAINER_MGMT zwróciła p_success=false dla ID: {}", trainerId);
            }
            return success;
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania UpdateTrainer z PKG_TRAINER_MGMT dla ID: {}", trainerId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas aktualizacji profilu trenera o ID " + trainerId + ": " + e.getMessage(), e);
        }
    }

    public boolean deleteTrainerProfile(Long trainerId) {
        Map<String, Object> params = Map.of("p_trainer_id", trainerId);
        try {
            Map<String, Object> result = deleteTrainerCall.execute(params);
            boolean success = checkSuccessFlag(result, "DeleteTrainer");
            if(!success) {
                log.warn("Procedura DeleteTrainer z PKG_TRAINER_MGMT zwróciła p_success=false dla ID: {}", trainerId);
            }
            return success;
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania DeleteTrainer z PKG_TRAINER_MGMT dla ID: {}", trainerId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas usuwania profilu trenera o ID " + trainerId + ": " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TrainerAdminViewDto> findTrainersBySpecialization(String specialization) {
        Map<String, Object> params = Map.of("p_specialization", specialization);
        try {
            Map<String, Object> result = findTrainersBySpecializationCall.execute(params);
            List<TrainerAdminViewDto> trainers = (List<TrainerAdminViewDto>) result.get("p_trainers");
            return trainers != null ? trainers : List.of();
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania FindTrainersBySpecialization z PKG_TRAINER_MGMT dla specjalizacji: {}", specialization, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas wyszukiwania trenerów: " + e.getMessage(), e);
        }
    }

    public int getTrainerCount() {
        try {
            Map<String, Object> result = getTrainerCountCall.execute();
            Object countObj = result.get("p_count");
            if (countObj instanceof BigDecimal) {
                return ((BigDecimal) countObj).intValue();
            } else if (countObj instanceof Number) {
                return ((Number) countObj).intValue();
            }
            log.error("Procedura GetTrainerCount z PKG_TRAINER_MGMT zwróciła nieprawidłowy typ dla p_count.");
            throw new OperationFailedException("Procedura GetTrainerCount zwróciła nieprawidłowy typ dla liczby trenerów.");
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetTrainerCount z PKG_TRAINER_MGMT", e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania liczby trenerów: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TrainerSessionDto> getTrainerSessions(Long trainerId, Date fromDate, Date toDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("p_trainer_id", trainerId);
        if (fromDate != null) {
            params.put("p_from_date", fromDate);
        }
        if (toDate != null) {
            params.put("p_to_date", toDate);
        }

        try {
            Map<String, Object> result = getTrainerSessionsCall.execute(params);
            if (checkSuccessFlag(result, "GetTrainerSessions")) {
                List<TrainerSessionDto> sessions = (List<TrainerSessionDto>) result.get("p_sessions");
                return sessions != null ? sessions : List.of();
            } else {
                log.warn("Procedura GetTrainerSessions z PKG_TRAINER_MGMT zwróciła p_success=false dla trenera ID: {}", trainerId);
                return List.of();
            }
        } catch (org.springframework.dao.DataAccessException e) {
            log.error("Błąd DataAccessException podczas wywoływania GetTrainerSessions z PKG_TRAINER_MGMT dla trenera ID: {}", trainerId, e);
            throw new OperationFailedException("Błąd dostępu do danych podczas pobierania sesji trenera: " + e.getMessage(), e);
        }
    }
}