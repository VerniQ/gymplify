package me.verni.gymplify.controller;

import jakarta.validation.Valid;
import me.verni.gymplify.dto.CreateTrainingPlanRequestDto;
import me.verni.gymplify.dto.ExerciseDto;
import me.verni.gymplify.dto.TrainingPlanDto;
import me.verni.gymplify.dto.UpdateTrainingPlanRequestDto;
import me.verni.gymplify.service.TrainingPlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/training-plans")
public class TrainingPlanController {

    private static final Logger log = LoggerFactory.getLogger(TrainingPlanController.class);
    private final TrainingPlanService trainingPlanService;

    @Autowired
    public TrainingPlanController(TrainingPlanService trainingPlanService) {
        this.trainingPlanService = trainingPlanService;
    }

    @PostMapping
    public ResponseEntity<TrainingPlanDto> createTrainingPlan(@Valid @RequestBody CreateTrainingPlanRequestDto requestDto) {
        log.info("Żądanie utworzenia nowego planu treningowego: {}", requestDto.getName());
        TrainingPlanDto createdPlan = trainingPlanService.createTrainingPlan(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdPlan.getPlanId())
                .toUri();
        log.info("Plan treningowy '{}' utworzony pomyślnie, ID: {}, location: {}", createdPlan.getName(), createdPlan.getPlanId(), location);
        return ResponseEntity.created(location).body(createdPlan);
    }

    @GetMapping("/{planId}")
    public ResponseEntity<TrainingPlanDto> getTrainingPlanById(@PathVariable Long planId) {
        log.info("Żądanie pobrania planu treningowego o ID: {}", planId);
        TrainingPlanDto plan = trainingPlanService.getTrainingPlanById(planId);
        return ResponseEntity.ok(plan);
    }

    @GetMapping
    public ResponseEntity<List<TrainingPlanDto>> getAllTrainingPlans() {
        log.info("Żądanie pobrania wszystkich planów treningowych");
        List<TrainingPlanDto> plans = trainingPlanService.getAllTrainingPlans();
        return ResponseEntity.ok(plans);
    }

    @PutMapping("/{planId}")
    public ResponseEntity<TrainingPlanDto> updateTrainingPlan(@PathVariable Long planId,
                                                              @Valid @RequestBody UpdateTrainingPlanRequestDto requestDto) {
        log.info("Żądanie aktualizacji planu treningowego o ID: {} na nazwę: {}", planId, requestDto.getName());
        TrainingPlanDto updatedPlan = trainingPlanService.updateTrainingPlan(planId, requestDto);
        return ResponseEntity.ok(updatedPlan);
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deleteTrainingPlan(@PathVariable Long planId) {
        log.info("Żądanie usunięcia planu treningowego o ID: {}", planId);
        trainingPlanService.deleteTrainingPlan(planId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{planId}/exercises/{exerciseId}")
    public ResponseEntity<Void> addExerciseToPlan(@PathVariable Long planId, @PathVariable Long exerciseId) {
        log.info("Żądanie dodania ćwiczenia ID: {} do planu ID: {}", exerciseId, planId);
        trainingPlanService.addExerciseToPlan(planId, exerciseId);
        log.info("Ćwiczenie ID {} pomyślnie dodane do planu ID {}", exerciseId, planId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{planId}/exercises/{exerciseId}")
    public ResponseEntity<Void> removeExerciseFromPlan(@PathVariable Long planId, @PathVariable Long exerciseId) {
        log.info("Żądanie usunięcia ćwiczenia ID: {} z planu ID: {}", exerciseId, planId);
        trainingPlanService.removeExerciseFromPlan(planId, exerciseId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{planId}/exercises")
    public ResponseEntity<Void> removeAllExercisesFromPlan(@PathVariable Long planId) {
        log.info("Żądanie usunięcia wszystkich ćwiczeń z planu ID: {}", planId);
        trainingPlanService.removeAllExercisesFromPlan(planId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{planId}/exercises")
    public ResponseEntity<List<ExerciseDto>> getExercisesForPlan(@PathVariable Long planId) {
        log.info("Żądanie pobrania ćwiczeń dla planu ID: {}", planId);
        List<ExerciseDto> exercises = trainingPlanService.getExercisesForPlan(planId);
        return ResponseEntity.ok(exercises);
    }
}