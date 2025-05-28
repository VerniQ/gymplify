package me.verni.gymplify.service;

import me.verni.gymplify.dto.CreateTrainingPlanRequestDto;
import me.verni.gymplify.dto.ExerciseDto;
import me.verni.gymplify.dto.TrainingPlanDto;
import me.verni.gymplify.dto.UpdateTrainingPlanRequestDto;
import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.repository.ExerciseRepository;
import me.verni.gymplify.repository.TrainingPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TrainingPlanService {

    private static final Logger log = LoggerFactory.getLogger(TrainingPlanService.class);

    private final TrainingPlanRepository trainingPlanRepository;
    private final ExerciseRepository exerciseRepository;

    @Autowired
    public TrainingPlanService(TrainingPlanRepository trainingPlanRepository, ExerciseRepository exerciseRepository) {
        this.trainingPlanRepository = trainingPlanRepository;
        this.exerciseRepository = exerciseRepository;
    }

    @Transactional
    public TrainingPlanDto createTrainingPlan(CreateTrainingPlanRequestDto dto) {
        log.info("Tworzenie nowego planu treningowego o nazwie: {}", dto.getName());
        try {
            Long planId = trainingPlanRepository.create(dto.getName().trim());
            log.info("Plan treningowy '{}' utworzony z ID: {}", dto.getName(), planId);
            return new TrainingPlanDto(planId, dto.getName().trim());
        } catch (OperationFailedException e) {
            log.error("Nie udało się utworzyć planu treningowego '{}': {}", dto.getName(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas tworzenia planu treningowego '{}': {}", dto.getName(), e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas tworzenia planu treningowego.", e);
        }
    }

    @Transactional
    public void deleteTrainingPlan(Long planId) {
        log.info("Usuwanie planu treningowego o ID: {}", planId);
        getTrainingPlanById(planId);

        try {
            trainingPlanRepository.deleteById(planId);
            log.info("Plan treningowy o ID: {} został usunięty.", planId);
        } catch (OperationFailedException e) {
            log.warn("Nie można usunąć planu treningowego ID {}: {}", planId, e.getMessage());
            throw new DataConflictException(e.getMessage());
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas usuwania planu treningowego ID {}: {}", planId, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas usuwania planu treningowego.", e);
        }
    }

    @Transactional
    public TrainingPlanDto updateTrainingPlan(Long planId, UpdateTrainingPlanRequestDto dto) {
        log.info("Aktualizacja planu treningowego o ID: {} na nową nazwę: {}", planId, dto.getName());
        TrainingPlanDto existingPlan = getTrainingPlanById(planId);

        try {
            trainingPlanRepository.update(planId, dto.getName().trim());
            log.info("Plan treningowy ID {} zaktualizowany. Nowa nazwa: {}", planId, dto.getName().trim());
            existingPlan.setName(dto.getName().trim());
            return existingPlan;
        } catch (OperationFailedException e) {
            log.error("Nie udało się zaktualizować planu treningowego ID {}: {}", planId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas aktualizacji planu treningowego ID {}: {}", planId, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas aktualizacji planu treningowego.", e);
        }
    }

    public TrainingPlanDto getTrainingPlanById(Long planId) {
        log.debug("Pobieranie planu treningowego o ID: {}", planId);
        return trainingPlanRepository.findById(planId)
                .orElseThrow(() -> {
                    log.warn("Nie znaleziono planu treningowego o ID: {}", planId);
                    return new ResourceNotFoundException("Nie znaleziono planu treningowego o ID: " + planId);
                });
    }

    public List<TrainingPlanDto> getAllTrainingPlans() {
        log.debug("Pobieranie wszystkich planów treningowych.");
        return trainingPlanRepository.findAll();
    }

    @Transactional
    public void addExerciseToPlan(Long planId, Long exerciseId) {
        log.info("Dodawanie ćwiczenia ID: {} do planu ID: {}", exerciseId, planId);
        getTrainingPlanById(planId);
        exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> {
                    log.warn("Próba dodania nieistniejącego ćwiczenia ID {} do planu ID {}", exerciseId, planId);
                    return new ResourceNotFoundException("Nie znaleziono ćwiczenia o ID: " + exerciseId);
                });

        try {
            trainingPlanRepository.addExerciseToPlan(planId, exerciseId);
            log.info("Ćwiczenie ID {} dodane do planu ID {}.", exerciseId, planId);
        } catch (OperationFailedException e) {
            log.warn("Nie udało się dodać ćwiczenia {} do planu {}: {}", exerciseId, planId, e.getMessage());
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("jest już w planie")) {
                throw new DataConflictException(e.getMessage());
            }
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas dodawania ćwiczenia {} do planu {}: {}", exerciseId, planId, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas dodawania ćwiczenia do planu.", e);
        }
    }

    @Transactional
    public void removeExerciseFromPlan(Long planId, Long exerciseId) {
        log.info("Usuwanie ćwiczenia ID: {} z planu ID: {}", exerciseId, planId);
        getTrainingPlanById(planId);

        try {
            trainingPlanRepository.removeExerciseFromPlan(planId, exerciseId);
            log.info("Ćwiczenie ID {} usunięte z planu ID {}.", exerciseId, planId);
        } catch (OperationFailedException e) {
            log.warn("Nie udało się usunąć ćwiczenia {} z planu {}: {}", exerciseId, planId, e.getMessage());
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("nie znaleziono ćwiczenia")) {
                throw new ResourceNotFoundException(e.getMessage());
            }
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas usuwania ćwiczenia {} z planu {}: {}", exerciseId, planId, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas usuwania ćwiczenia z planu.", e);
        }
    }

    @Transactional
    public void removeAllExercisesFromPlan(Long planId) {
        log.info("Usuwanie wszystkich ćwiczeń z planu ID: {}", planId);
        getTrainingPlanById(planId);

        try {
            trainingPlanRepository.removeAllExercisesFromPlan(planId);
            log.info("Wszystkie ćwiczenia zostały usunięte z planu ID {}.", planId);
        } catch (OperationFailedException e) {
            log.error("Nie udało się usunąć wszystkich ćwiczeń z planu ID {}: {}", planId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas usuwania wszystkich ćwiczeń z planu ID {}: {}", planId, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas usuwania wszystkich ćwiczeń z planu.", e);
        }
    }

    public List<ExerciseDto> getExercisesForPlan(Long planId) {
        log.debug("Pobieranie ćwiczeń dla planu ID: {}", planId);
        try {
            getTrainingPlanById(planId);
            return trainingPlanRepository.getExercisesForPlan(planId);
        } catch (OperationFailedException e) {
            log.error("Błąd operacji podczas pobierania ćwiczeń dla planu ID {}: {}", planId, e.getMessage());
            throw e;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas pobierania ćwiczeń dla planu ID {}: {}", planId, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas pobierania ćwiczeń dla planu.", e);
        }
    }
}