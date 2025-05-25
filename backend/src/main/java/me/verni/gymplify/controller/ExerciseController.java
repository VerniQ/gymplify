package me.verni.gymplify.controller;

import me.verni.gymplify.dto.ExerciseDto;
import me.verni.gymplify.dto.ExerciseRequestDto;
import me.verni.gymplify.service.ExerciseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/exercises")
public class ExerciseController {

    private final ExerciseService exerciseService;

    @Autowired
    public ExerciseController(ExerciseService exerciseService) {
        this.exerciseService = exerciseService;
    }

    @GetMapping
    public ResponseEntity<List<ExerciseDto>> getAllExercises() {
        List<ExerciseDto> exercises = exerciseService.getAllExercises();
        return ResponseEntity.ok(exercises);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseDto> getExerciseById(@PathVariable Long id) {
        ExerciseDto exercise = exerciseService.getExerciseById(id);
        return ResponseEntity.ok(exercise);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ExerciseDto>> findExercisesByMuscleGroup(@PathVariable Long groupId) {
        List<ExerciseDto> exercises = exerciseService.findExercisesByMuscleGroupId(groupId);
        return ResponseEntity.ok(exercises);
    }

    @PostMapping
    public ResponseEntity<ExerciseDto> addExercise(@Valid @RequestBody ExerciseRequestDto requestDto) {
        ExerciseDto createdExercise = exerciseService.addExercise(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(createdExercise.getExerciseId())
                .toUri();
        return ResponseEntity.created(location).body(createdExercise);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExerciseDto> updateExercise(@PathVariable Long id, @Valid @RequestBody ExerciseRequestDto requestDto) {
        ExerciseDto updatedExercise = exerciseService.updateExercise(id, requestDto);
        return ResponseEntity.ok(updatedExercise);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        exerciseService.deleteExercise(id);
        return ResponseEntity.noContent().build();
    }
}