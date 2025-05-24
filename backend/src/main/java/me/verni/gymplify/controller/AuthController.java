package me.verni.gymplify.controller;

import me.verni.gymplify.dto.LoginRequestDto;
import me.verni.gymplify.dto.RegistrationRequestDto;
import me.verni.gymplify.dto.User; // Zaimportuj User DTO, jeśli nie jest jeszcze
import me.verni.gymplify.exception.UserLoginException;
import me.verni.gymplify.exception.UserRegistrationException;
import me.verni.gymplify.service.UserService;
import me.verni.gymplify.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> register(@RequestBody RegistrationRequestDto request) {
        try {
            User createdUser = userService.createUser(request.getUsername(), request.getEmail(), request.getPassword());
            return ResponseEntity.ok(Map.of("message", "User registered successfully. User ID: " + createdUser.getUserId()));
        } catch (UserRegistrationException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto request) {
        try {
            User user = userService.login(request.getEmail(), request.getPassword());
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

            return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "token", token,
                    "user", Map.of(
                            "userId", user.getUserId(),
                            "email", user.getEmail(),
                            "username", user.getUsername(),
                            "role", user.getRole().name()
                    )
            ));
        } catch (UserLoginException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}