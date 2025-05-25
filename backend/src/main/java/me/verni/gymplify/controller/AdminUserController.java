package me.verni.gymplify.controller;

import me.verni.gymplify.dto.UserAdminViewDto;
import me.verni.gymplify.dto.UserCreationAdminRequestDto;
import me.verni.gymplify.dto.UserRoleUpdateRequestDto;
import me.verni.gymplify.service.AdminUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserController.class);
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<UserAdminViewDto>> getAllUsers() {
        logger.info("Żądanie GET /api/admin/users - pobranie wszystkich użytkowników");
        List<UserAdminViewDto> users = adminUserService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserAdminViewDto> getUserById(@PathVariable Long userId) {
        logger.info("Żądanie GET /api/admin/users/{} - pobranie użytkownika po ID", userId);
        UserAdminViewDto user = adminUserService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<UserAdminViewDto> createUserByAdmin(@RequestBody UserCreationAdminRequestDto requestDto) {
        logger.info("Żądanie POST /api/admin/users - tworzenie użytkownika: email={}, username={}", requestDto.getEmail(), requestDto.getUsername());
        UserAdminViewDto createdUser = adminUserService.createUserByAdmin(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdUser.getUserId())
                .toUri();
        logger.info("Użytkownik utworzony pomyślnie, ID: {}, location: {}", createdUser.getUserId(), location);
        return ResponseEntity.created(location).body(createdUser);
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<UserAdminViewDto> updateUserRole(@PathVariable Long userId, @RequestBody UserRoleUpdateRequestDto requestDto) {
        logger.info("Żądanie PUT /api/admin/users/{}/role - aktualizacja roli na: {}", userId, requestDto.getRole());
        UserAdminViewDto updatedUser = adminUserService.updateUserRole(userId, requestDto.getRole());
        logger.info("Rola dla użytkownika ID: {} zaktualizowana pomyślnie.", userId);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        logger.info("Żądanie DELETE /api/admin/users/{} - usuwanie użytkownika", userId);
        adminUserService.deleteUser(userId);
        logger.info("Użytkownik ID: {} usunięty pomyślnie.", userId);
        return ResponseEntity.noContent().build();
    }
}