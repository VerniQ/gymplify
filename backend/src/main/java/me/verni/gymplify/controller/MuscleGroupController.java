package me.verni.gymplify.controller;

import me.verni.gymplify.dto.MuscleGroupDto;
import me.verni.gymplify.dto.MuscleGroupRequestDto;
import me.verni.gymplify.service.MuscleGroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/muscle-groups")
public class MuscleGroupController {

    private final MuscleGroupService muscleGroupService;

    @Autowired
    public MuscleGroupController(MuscleGroupService muscleGroupService) {
        this.muscleGroupService = muscleGroupService;
    }

    @GetMapping
    public ResponseEntity<List<MuscleGroupDto>> getAllMuscleGroups() {
        List<MuscleGroupDto> muscleGroups = muscleGroupService.getAllMuscleGroups();
        return ResponseEntity.ok(muscleGroups);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MuscleGroupDto> getMuscleGroupById(@PathVariable Long id) {
        MuscleGroupDto muscleGroup = muscleGroupService.getMuscleGroupById(id);
        return ResponseEntity.ok(muscleGroup);
    }

    @PostMapping
    public ResponseEntity<MuscleGroupDto> addMuscleGroup(@Valid @RequestBody MuscleGroupRequestDto requestDto) {
        MuscleGroupDto createdMuscleGroup = muscleGroupService.addMuscleGroup(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(createdMuscleGroup.getGroupId())
                .toUri();
        return ResponseEntity.created(location).body(createdMuscleGroup);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MuscleGroupDto> updateMuscleGroup(@PathVariable Long id, @Valid @RequestBody MuscleGroupRequestDto requestDto) {
        MuscleGroupDto updatedMuscleGroup = muscleGroupService.updateMuscleGroup(id, requestDto);
        return ResponseEntity.ok(updatedMuscleGroup);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMuscleGroup(@PathVariable Long id) {
        muscleGroupService.deleteMuscleGroup(id);
        return ResponseEntity.noContent().build();
    }
}