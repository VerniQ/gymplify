package me.verni.gymplify.service;

import me.verni.gymplify.dto.User;
import me.verni.gymplify.dto.UserAdminViewDto;
import me.verni.gymplify.dto.UserCreationAdminRequestDto;
import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.repository.UserRepository;
import me.verni.gymplify.util.EmailValidator;
import me.verni.gymplify.util.PasswordHasher;
import me.verni.gymplify.util.PasswordValidator;
import me.verni.gymplify.util.RoleType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);
    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserAdminViewDto> getAllUsers() {
        logger.debug("Pobieranie wszystkich użytkowników dla panelu admina");
        List<User> users = userRepository.findAllUsers();
        if (users.isEmpty()) {
            logger.info("Nie znaleziono żadnych użytkowników.");
        }
        return users.stream()
                .map(user -> new UserAdminViewDto(user.getUserId(), user.getUsername(), user.getEmail(), user.getRole()))
                .collect(Collectors.toList());
    }

    public UserAdminViewDto getUserById(Long userId) {
        logger.debug("Pobieranie użytkownika o ID: {} dla panelu admina", userId);
        User user = userRepository.findUserById(userId)
                .orElseThrow(() -> {
                    logger.warn("Nie znaleziono użytkownika o ID: {} podczas próby pobrania przez admina.", userId);
                    return new ResourceNotFoundException("User not found with ID: " + userId);
                });
        return new UserAdminViewDto(user.getUserId(), user.getUsername(), user.getEmail(), user.getRole());
    }

    @Transactional
    public UserAdminViewDto createUserByAdmin(UserCreationAdminRequestDto dto) {
        logger.info("Administrator próbuje utworzyć użytkownika: email={}, username={}", dto.getEmail(), dto.getUsername());
        if (!EmailValidator.isValidEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Nieprawidłowy format emaila: " + dto.getEmail());
        }
        PasswordValidator.ValidationResult passwordValidation = PasswordValidator.validatePassword(dto.getPassword());
        if (!passwordValidation.isValid()) {
            throw new IllegalArgumentException("Hasło nie spełnia wymagań: " + passwordValidation.getMessage());
        }
        if (userRepository.findUserDetailsByEmail(dto.getEmail()).isPresent()) {
            throw new DataConflictException("Użytkownik z emailem '" + dto.getEmail() + "' już istnieje.");
        }

        RoleType roleToSet;
        try {
            roleToSet = RoleType.valueOf(dto.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Nieprawidłowa rola: '" + dto.getRole() + "'. Dostępne role: USER, TRAINER, ADMIN.");
        }

        String hashedPassword = PasswordHasher.hash(dto.getPassword());
        userRepository.createUser(dto.getUsername(), hashedPassword, dto.getEmail(), roleToSet.name());
        logger.info("Użytkownik '{}' utworzony przez admina z rolą {}.", dto.getEmail(), roleToSet.name());

        User createdUser = userRepository.findUserDetailsByEmail(dto.getEmail())
                .orElseThrow(() -> {
                    logger.error("KRYTYCZNY BŁĄD: Nie udało się pobrać użytkownika '{}' bezpośrednio po utworzeniu przez admina.", dto.getEmail());
                    return new OperationFailedException("Nie udało się pobrać użytkownika po utworzeniu.");
                });
        return new UserAdminViewDto(createdUser.getUserId(), createdUser.getUsername(), createdUser.getEmail(), createdUser.getRole());
    }

    @Transactional
    public UserAdminViewDto updateUserRole(Long userId, String newRoleString) {
        logger.info("Administrator próbuje zaktualizować rolę dla użytkownika ID {} na '{}'", userId, newRoleString);
        User user = userRepository.findUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Nie znaleziono użytkownika o ID: " + userId));

        RoleType newRole;
        try {
            newRole = RoleType.valueOf(newRoleString.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Nieprawidłowa rola: '" + newRoleString + "'. Dostępne role: USER, TRAINER, ADMIN.");
        }

        if (user.getRole() == newRole) {
            logger.info("Rola użytkownika ID {} to już {}, nie ma potrzeby aktualizacji.", userId, newRole);
            return new UserAdminViewDto(user.getUserId(), user.getUsername(), user.getEmail(), user.getRole());
        }

        boolean success = userRepository.updateUserRole(userId, newRole.name());
        if (!success) {
            throw new OperationFailedException("Nie udało się zaktualizować roli dla użytkownika ID: " + userId + ". Procedura PL/SQL zgłosiła błąd.");
        }
        logger.info("Rola dla użytkownika ID {} została pomyślnie zaktualizowana na {}.", userId, newRole.name());

        User updatedUser = userRepository.findUserById(userId)
                .orElseThrow(() -> new OperationFailedException("Nie udało się pobrać użytkownika po aktualizacji roli."));
        return new UserAdminViewDto(updatedUser.getUserId(), updatedUser.getUsername(), updatedUser.getEmail(), updatedUser.getRole());
    }

    @Transactional
    public void deleteUser(Long userId) {
        logger.info("Administrator próbuje usunąć użytkownika o ID: {}", userId);
        userRepository.findUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Nie znaleziono użytkownika o ID: " + userId + " do usunięcia."));

        boolean success = userRepository.deleteUser(userId);
        if (!success) {
            throw new OperationFailedException("Nie udało się usunąć użytkownika o ID: " + userId + ". Procedura PL/SQL zgłosiła błąd.");
        }
        logger.info("Użytkownik o ID {} został pomyślnie usunięty.", userId);
    }
}