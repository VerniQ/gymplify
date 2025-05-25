package me.verni.gymplify.service;

import me.verni.gymplify.dto.ExerciseDto;
import me.verni.gymplify.dto.ExerciseRequestDto;
import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.repository.ExerciseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExerciseService {

    private static final Logger log = LoggerFactory.getLogger(ExerciseService.class);
    private final ExerciseRepository exerciseRepository;

    @Autowired
    public ExerciseService(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    public List<ExerciseDto> getAllExercises() {
        log.info("Pobieranie wszystkich ćwiczeń");
        return exerciseRepository.findAll();
    }

    public ExerciseDto getExerciseById(Long id) {
        log.info("Pobieranie ćwiczenia o ID: {}", id);
        return exerciseRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Nie znaleziono ćwiczenia o ID: {}", id);
                    return new ResourceNotFoundException("Nie znaleziono ćwiczenia o ID: " + id);
                });
    }

    public List<ExerciseDto> findExercisesByMuscleGroupId(Long groupId) {
        log.info("Pobieranie ćwiczeń dla grupy mięśniowej o ID: {}", groupId);
        return exerciseRepository.findByMuscleGroupId(groupId);
    }

    public ExerciseDto addExercise(ExerciseRequestDto requestDto) {
        log.info("Dodawanie nowego ćwiczenia: {}", requestDto.getName());
        try {
            // Repozytorium teraz przyjmuje ExerciseRequestDto
            Long newExerciseId = exerciseRepository.save(requestDto);
            return getExerciseById(newExerciseId);
        } catch (OperationFailedException e) {
            log.error("Nie udało się dodać ćwiczenia '{}': {}", requestDto.getName(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas dodawania ćwiczenia '{}': {}", requestDto.getName(), e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas dodawania ćwiczenia.", e);
        }
    }

    public ExerciseDto updateExercise(Long id, ExerciseRequestDto requestDto) {
        log.info("Aktualizacja ćwiczenia o ID: {}", id);
        getExerciseById(id);

        try {
            boolean success = exerciseRepository.update(id, requestDto);
            if (!success) {
                log.warn("Nie udało się zaktualizować ćwiczenia o ID: {}. Procedura zwróciła błąd.", id);
                throw new OperationFailedException("Nie udało się zaktualizować ćwiczenia o ID: " + id + ". Procedura zgłosiła błąd.");
            }
            return getExerciseById(id);
        } catch (OperationFailedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas aktualizacji ćwiczenia o ID '{}': {}", id, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas aktualizacji ćwiczenia.", e);
        }
    }

    public void deleteExercise(Long id) {
        log.info("Usuwanie ćwiczenia o ID: {}", id);
        getExerciseById(id);

        try {
            boolean success = exerciseRepository.deleteById(id);
            if (!success) {
                log.warn("Nie udało się usunąć ćwiczenia o ID: {}. Procedura zwróciła błąd.", id);
                throw new DataConflictException("Nie można usunąć ćwiczenia (ID: " + id + "). Możliwe, że istnieją powiązane dane lub procedura zgłosiła błąd.");
            }
        } catch (DataConflictException e) {
            throw e;
        } catch (Exception e) {
            log.error("Nieoczekiwany błąd podczas usuwania ćwiczenia o ID '{}': {}", id, e.getMessage(), e);
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas usuwania ćwiczenia.", e);
        }
    }
}