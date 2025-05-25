package me.verni.gymplify.controller;

import me.verni.gymplify.dto.TrainerAdminViewDto;
import me.verni.gymplify.dto.TrainerProfileCreationDto;
import me.verni.gymplify.dto.TrainerProfileUpdateDto;
import me.verni.gymplify.service.AdminTrainerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/trainer-profiles")
public class AdminTrainerController {
    private static final Logger logger = LoggerFactory.getLogger(AdminTrainerController.class);
    private final AdminTrainerService adminTrainerService;

    public AdminTrainerController(AdminTrainerService adminTrainerService) {
        this.adminTrainerService = adminTrainerService;
    }

    @PostMapping
    public ResponseEntity<TrainerAdminViewDto> createTrainerProfile(@RequestBody TrainerProfileCreationDto dto) {
        logger.info("Żądanie POST /api/admin/trainer-profiles - tworzenie profilu trenera dla użytkownika ID: {}", dto.getUserId());
        TrainerAdminViewDto createdProfile = adminTrainerService.createTrainerProfile(dto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdProfile.getTrainerId())
                .toUri();
        logger.info("Profil trenera utworzony pomyślnie, ID: {}, location: {}", createdProfile.getTrainerId(), location);
        return ResponseEntity.created(location).body(createdProfile);
    }

    @GetMapping
    public ResponseEntity<List<TrainerAdminViewDto>> getAllTrainerProfiles() {
        logger.info("Żądanie GET /api/admin/trainer-profiles - pobranie wszystkich profili trenerów");
        return ResponseEntity.ok(adminTrainerService.getAllTrainerProfiles());
    }

    @GetMapping("/{trainerId}")
    public ResponseEntity<TrainerAdminViewDto> getTrainerProfileById(@PathVariable Long trainerId) {
        logger.info("Żądanie GET /api/admin/trainer-profiles/{} - pobranie profilu trenera po ID", trainerId);
        return ResponseEntity.ok(adminTrainerService.getTrainerProfileById(trainerId));
    }

    @PutMapping("/{trainerId}")
    public ResponseEntity<TrainerAdminViewDto> updateTrainerProfile(@PathVariable Long trainerId, @RequestBody TrainerProfileUpdateDto dto) {
        logger.info("Żądanie PUT /api/admin/trainer-profiles/{} - aktualizacja profilu trenera", trainerId);
        TrainerAdminViewDto updatedProfile = adminTrainerService.updateTrainerProfile(trainerId, dto);
        return ResponseEntity.ok(updatedProfile);
    }

    @DeleteMapping("/{trainerId}")
    public ResponseEntity<Void> deleteTrainerProfile(@PathVariable Long trainerId) {
        logger.info("Żądanie DELETE /api/admin/trainer-profiles/{} - usuwanie profilu trenera", trainerId);
        adminTrainerService.deleteTrainerProfile(trainerId);
        return ResponseEntity.noContent().build();
    }
}