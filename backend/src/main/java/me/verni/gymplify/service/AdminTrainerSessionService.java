package me.verni.gymplify.service;

import me.verni.gymplify.dto.TrainerSessionCreationDto;
import me.verni.gymplify.dto.TrainerSessionDto;
import me.verni.gymplify.dto.TrainerSessionUpdateDto;
import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.repository.TrainerSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class AdminTrainerSessionService {
    private static final Logger log = LoggerFactory.getLogger(AdminTrainerSessionService.class);

    private final TrainerSessionRepository trainerSessionRepository;

    @Autowired
    public AdminTrainerSessionService(TrainerSessionRepository trainerSessionRepository) {
        this.trainerSessionRepository = trainerSessionRepository;
    }

    private void validateSessionTimes(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new DataConflictException("Czas rozpoczęcia sesji musi być wcześniejszy niż czas zakończenia.");
        }
    }

    @Transactional
    public TrainerSessionDto createTrainerSession(TrainerSessionCreationDto dto) {
        validateSessionTimes(dto.getStartTime(), dto.getEndTime());
        LocalDateTime startDateTime = LocalDateTime.of(dto.getSessionDate(), dto.getStartTime());
        LocalDateTime endDateTime = LocalDateTime.of(dto.getSessionDate(), dto.getEndTime());

        try {
            Long scheduleId = trainerSessionRepository.create(
                    dto.getTrainerId(),
                    dto.getSessionDate(),
                    startDateTime,
                    endDateTime
            );
            return getTrainerSessionById(scheduleId);
        } catch (OperationFailedException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("trener") && e.getMessage().toLowerCase().contains("nie istnieje")) {
                throw new ResourceNotFoundException(e.getMessage());
            } else if (e.getMessage() != null && (e.getMessage().toLowerCase().contains("musi być wcześniejszy") || e.getMessage().toLowerCase().contains("ma już zaplanowaną sesję"))) {
                throw new DataConflictException(e.getMessage());
            }
            throw e;
        }
    }

    @Transactional
    public void deleteTrainerSession(Long scheduleId) {
        getTrainerSessionById(scheduleId);
        try {
            trainerSessionRepository.deleteById(scheduleId);
        } catch (OperationFailedException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("sesja trenera") && e.getMessage().toLowerCase().contains("nie istnieje")) {
                throw new ResourceNotFoundException(e.getMessage());
            }
            throw new DataConflictException("Nie można usunąć sesji trenera: " + e.getMessage());
        }
    }

    @Transactional
    public TrainerSessionDto updateTrainerSession(Long scheduleId, TrainerSessionUpdateDto dto) {
        getTrainerSessionById(scheduleId);
        validateSessionTimes(dto.getStartTime(), dto.getEndTime());
        LocalDateTime startDateTime = LocalDateTime.of(dto.getSessionDate(), dto.getStartTime());
        LocalDateTime endDateTime = LocalDateTime.of(dto.getSessionDate(), dto.getEndTime());

        try {
            trainerSessionRepository.update(
                    scheduleId,
                    dto.getTrainerId(),
                    dto.getSessionDate(),
                    startDateTime,
                    endDateTime
            );
            return getTrainerSessionById(scheduleId);
        } catch (OperationFailedException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("sesja trenera") && e.getMessage().toLowerCase().contains("nie istnieje")) {
                throw new ResourceNotFoundException(e.getMessage());
            } else if (e.getMessage() != null && e.getMessage().toLowerCase().contains("trener") && e.getMessage().toLowerCase().contains("nie istnieje")) {
                throw new ResourceNotFoundException(e.getMessage());
            } else if (e.getMessage() != null && (e.getMessage().toLowerCase().contains("musi być wcześniejszy") || e.getMessage().toLowerCase().contains("ma już zaplanowaną sesję"))) {
                throw new DataConflictException(e.getMessage());
            }
            throw e;
        }
    }

    public TrainerSessionDto getTrainerSessionById(Long scheduleId) {
        return trainerSessionRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Nie znaleziono sesji trenera o ID: " + scheduleId));
    }

    public List<TrainerSessionDto> getTrainerSessionsByTrainer(Long trainerId, LocalDate fromDate, LocalDate toDate) {
        try {
            return trainerSessionRepository.findByTrainerId(trainerId, fromDate, toDate);
        } catch (OperationFailedException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("trener") && e.getMessage().toLowerCase().contains("nie istnieje")) {
                throw new ResourceNotFoundException(e.getMessage());
            }
            throw e;
        }
    }

    public List<TrainerSessionDto> getAllTrainerSessions(LocalDate fromDate, LocalDate toDate) {
        return trainerSessionRepository.findAll(fromDate, toDate);
    }
}