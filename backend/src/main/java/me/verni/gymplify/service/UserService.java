package me.verni.gymplify.service;

import me.verni.gymplify.dto.User; // Twoje DTO użytkownika
import me.verni.gymplify.exception.UserLoginException;
import me.verni.gymplify.exception.UserRegistrationException;
import me.verni.gymplify.util.EmailValidator;
import me.verni.gymplify.util.PasswordHasher;
import me.verni.gymplify.util.PasswordValidator;
import me.verni.gymplify.util.RoleType;
import org.springframework.security.crypto.password.PasswordEncoder; // Można użyć PasswordEncoder z Spring Security zamiast jBCrypt bezpośrednio
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Dla zarządzania transakcjami

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }


    @Transactional
    public User createUser(String username, String email, String password) throws UserRegistrationException {
        if (!EmailValidator.isValidEmail(email)) {
            throw new UserRegistrationException("Invalid email format.");
        }

        PasswordValidator.ValidationResult passwordValidation = PasswordValidator.validatePassword(password);
        if (!passwordValidation.isValid()) {
            throw new UserRegistrationException("Password validation failed: " + passwordValidation.getMessage());
        }


        if (userRepository.findUserDetailsByEmail(email).isPresent()) {
            throw new UserRegistrationException("User with this email already exists.");
        }


        String hashedPassword = PasswordHasher.hash(password);

        String defaultRole = RoleType.USER.name();

        try {
            userRepository.createUser(username, hashedPassword, email, defaultRole);

            return userRepository.findUserDetailsByEmail(email)
                    .orElseThrow(() -> new UserRegistrationException("Failed to retrieve user after creation."));
        } catch (Exception e) {
            throw new UserRegistrationException("Failed to create user in repository: " + e.getMessage());
        }
    }

    public User login(String email, String password) throws UserLoginException {
        Optional<User> userOptional = userRepository.findUserDetailsByEmail(email);

        if (userOptional.isEmpty()) {
            throw new UserLoginException("Invalid email or password.");
        }

        User user = userOptional.get();

        if (!PasswordHasher.matches(password, user.getPasswordHash())) {
            throw new UserLoginException("Invalid email or password.");
        }

        return user;
    }
}