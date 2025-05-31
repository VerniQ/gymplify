package me.verni.gymplify.controller;

import jakarta.validation.Valid;
import me.verni.gymplify.dto.PersonalPlanCreationDto;
import me.verni.gymplify.dto.PersonalPlanDto;
import me.verni.gymplify.dto.PersonalPlanUpdateDto;
import me.verni.gymplify.dto.UserInPersonalPlanDto;
import me.verni.gymplify.service.PersonalPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/personal-plans")
public class PersonalPlanController {

    private final PersonalPlanService personalPlanService;

    @Autowired
    public PersonalPlanController(PersonalPlanService personalPlanService) {
        this.personalPlanService = personalPlanService;
    }

    @PostMapping
    public ResponseEntity<PersonalPlanDto> assignPlanToUser(@Valid @RequestBody PersonalPlanCreationDto creationDto) {
        PersonalPlanDto createdPlan = personalPlanService.assignPlanToUser(creationDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdPlan.getPersonalPlanId())
                .toUri();
        return ResponseEntity.created(location).body(createdPlan);
    }

    @DeleteMapping("/{personalPlanId}")
    public ResponseEntity<Void> unassignPersonalPlanById(@PathVariable Long personalPlanId) {
        personalPlanService.unassignPersonalPlanById(personalPlanId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}/plan/{planId}")
    public ResponseEntity<Void> unassignPlanFromUser(
            @PathVariable Long userId,
            @PathVariable Long planId,
            @RequestParam(required = false) Long trainerId) {
        personalPlanService.unassignPlanFromUser(userId, planId, trainerId);
        return ResponseEntity.noContent().build();
    }


    @PutMapping("/{personalPlanId}")
    public ResponseEntity<PersonalPlanDto> updatePersonalPlanAssignment(
            @PathVariable Long personalPlanId,
            @Valid @RequestBody PersonalPlanUpdateDto updateDto) {
        PersonalPlanDto updatedPlan = personalPlanService.updatePersonalPlanAssignment(personalPlanId, updateDto);
        return ResponseEntity.ok(updatedPlan);
    }

    @GetMapping("/{personalPlanId}")
    public ResponseEntity<PersonalPlanDto> getPersonalPlanById(@PathVariable Long personalPlanId) {
        PersonalPlanDto plan = personalPlanService.getPersonalPlanById(personalPlanId);
        return ResponseEntity.ok(plan);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PersonalPlanDto>> getPersonalPlansForUser(@PathVariable Long userId) {
        List<PersonalPlanDto> plans = personalPlanService.getPersonalPlansForUser(userId);
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/plan/{planId}/users")
    public ResponseEntity<List<UserInPersonalPlanDto>> getUsersForPersonalPlanByPlanId(@PathVariable Long planId) {
        List<UserInPersonalPlanDto> users = personalPlanService.getUsersForPersonalPlanByPlanId(planId);
        return ResponseEntity.ok(users);
    }

    @GetMapping
    public ResponseEntity<List<PersonalPlanDto>> listAllPersonalPlans() {
        List<PersonalPlanDto> plans = personalPlanService.listAllPersonalPlans();
        return ResponseEntity.ok(plans);
    }
}