package me.verni.gymplify.controller;

import jakarta.validation.Valid;
import me.verni.gymplify.dto.TrainerSessionCreationDto;
import me.verni.gymplify.dto.TrainerSessionDto;
import me.verni.gymplify.dto.TrainerSessionUpdateDto;
import me.verni.gymplify.service.AdminTrainerSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/trainer-sessions")
public class AdminTrainerSessionController {

    private final AdminTrainerSessionService adminTrainerSessionService;

    @Autowired
    public AdminTrainerSessionController(AdminTrainerSessionService adminTrainerSessionService) {
        this.adminTrainerSessionService = adminTrainerSessionService;
    }

    @PostMapping
    public ResponseEntity<TrainerSessionDto> createTrainerSession(@Valid @RequestBody TrainerSessionCreationDto creationDto) {
        TrainerSessionDto createdSession = adminTrainerSessionService.createTrainerSession(creationDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdSession.getScheduleId())
                .toUri();
        return ResponseEntity.created(location).body(createdSession);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteTrainerSession(@PathVariable Long sessionId) {
        adminTrainerSessionService.deleteTrainerSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<TrainerSessionDto> updateTrainerSession(@PathVariable Long sessionId,
                                                                  @Valid @RequestBody TrainerSessionUpdateDto updateDto) {
        TrainerSessionDto updatedSession = adminTrainerSessionService.updateTrainerSession(sessionId, updateDto);
        return ResponseEntity.ok(updatedSession);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<TrainerSessionDto> getTrainerSessionById(@PathVariable Long sessionId) {
        TrainerSessionDto session = adminTrainerSessionService.getTrainerSessionById(sessionId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<List<TrainerSessionDto>> getTrainerSessionsByTrainer(
            @PathVariable Long trainerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<TrainerSessionDto> sessions = adminTrainerSessionService.getTrainerSessionsByTrainer(trainerId, fromDate, toDate);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping
    public ResponseEntity<List<TrainerSessionDto>> getAllTrainerSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<TrainerSessionDto> sessions = adminTrainerSessionService.getAllTrainerSessions(fromDate, toDate);
        return ResponseEntity.ok(sessions);
    }
}