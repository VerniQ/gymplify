package me.verni.gymplify.controller;


import me.verni.gymplify.dto.LoginRequestDto;
import me.verni.gymplify.dto.RegistrationRequestDto;
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
            userService.createUser(request.getName(), request.getEmail(), request.getPassword());
            return ResponseEntity.ok(Map.of("message", "User registered successfully"));
        } catch (UserRegistrationException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto request) {
        try {
            var user = userService.login(request.getEmail(), request.getPassword());
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

            return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "token", token
            ));
        } catch (UserLoginException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
