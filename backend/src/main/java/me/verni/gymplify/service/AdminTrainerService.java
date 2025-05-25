package me.verni.gymplify.service;

import me.verni.gymplify.dto.TrainerAdminViewDto;
import me.verni.gymplify.dto.TrainerProfileCreationDto;
import me.verni.gymplify.dto.TrainerProfileUpdateDto;
import me.verni.gymplify.dto.User; // Potrzebne do sprawdzenia roli
import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.repository.TrainerProfileRepository;
import me.verni.gymplify.repository.UserRepository; // Potrzebne do sprawdzenia roli
import me.verni.gymplify.util.RoleType; // Potrzebne do sprawdzenia roli
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminTrainerService {
    private static final Logger logger = LoggerFactory.getLogger(AdminTrainerService.class);
    private final TrainerProfileRepository trainerProfileRepository;
    private final UserRepository userRepository;


    public AdminTrainerService(TrainerProfileRepository trainerProfileRepository, UserRepository userRepository) {
        this.trainerProfileRepository = trainerProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TrainerAdminViewDto createTrainerProfile(TrainerProfileCreationDto dto) {
        logger.info("Administrator próbuje utworzyć profil trenera dla użytkownika o ID: {}", dto.getUserId());

        User user = userRepository.findUserById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Użytkownik o ID: " + dto.getUserId() + " nie istnieje. Nie można utworzyć profilu trenera."));

        if (user.getRole() != RoleType.TRAINER) {
            throw new DataConflictException("Użytkownik o ID: " + dto.getUserId() + " nie ma roli TRAINER. Nie można utworzyć profilu trenera.");
        }

        Long newTrainerId = trainerProfileRepository.createTrainerProfile(
                dto.getUserId(), dto.getName(), dto.getSurname(), dto.getSpecialization(), dto.getContact()
        );

        logger.info("Profil trenera został utworzony z ID: {}", newTrainerId);
        return trainerProfileRepository.findTrainerProfileById(newTrainerId)
                .orElseThrow(() -> new OperationFailedException("Nie udało się pobrać profilu trenera po jego utworzeniu. ID: " + newTrainerId));
    }

    public List<TrainerAdminViewDto> getAllTrainerProfiles() {
        logger.debug("Pobieranie wszystkich profili trenerów dla panelu admina");
        return trainerProfileRepository.findAllTrainerProfiles();
    }

    public TrainerAdminViewDto getTrainerProfileById(Long trainerId) {
        logger.debug("Pobieranie profilu trenera o ID: {} dla panelu admina", trainerId);
        return trainerProfileRepository.findTrainerProfileById(trainerId)
                .orElseThrow(() -> {
                    logger.warn("Nie znaleziono profilu trenera o ID: {}", trainerId);
                    return new ResourceNotFoundException("Trainer profile not found with ID: " + trainerId);
                });
    }

    @Transactional
    public TrainerAdminViewDto updateTrainerProfile(Long trainerId, TrainerProfileUpdateDto dto) {
        logger.info("Administrator próbuje zaktualizować profil trenera o ID: {}", trainerId);
        trainerProfileRepository.findTrainerProfileById(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer profile not found with ID: " + trainerId + " for update."));

        boolean success = trainerProfileRepository.updateTrainerProfile(
                trainerId, dto.getName(), dto.getSurname(), dto.getSpecialization(), dto.getContact()
        );
        if (!success) {
            throw new OperationFailedException("Failed to update trainer profile for ID: " + trainerId + ". Procedure reported failure.");
        }
        logger.info("Profil trenera o ID {} zaktualizowany pomyślnie.", trainerId);
        return trainerProfileRepository.findTrainerProfileById(trainerId)
                .orElseThrow(() -> new OperationFailedException("Failed to retrieve trainer profile after update. Critical error."));
    }

    @Transactional
    public void deleteTrainerProfile(Long trainerId) {
        logger.info("Administrator próbuje usunąć profil trenera o ID: {}", trainerId);
        trainerProfileRepository.findTrainerProfileById(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer profile not found with ID: " + trainerId + " for deletion."));

        boolean success = trainerProfileRepository.deleteTrainerProfile(trainerId);
        if (!success) {
            throw new OperationFailedException("Failed to delete trainer profile for ID: " + trainerId + ". Procedure reported failure.");
        }
        logger.info("Profil trenera o ID {} usunięty pomyślnie.", trainerId);
    }
}