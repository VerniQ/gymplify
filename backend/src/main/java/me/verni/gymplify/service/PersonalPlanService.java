package me.verni.gymplify.service;

import me.verni.gymplify.dto.PersonalPlanCreationDto;
import me.verni.gymplify.dto.PersonalPlanDto;
import me.verni.gymplify.dto.PersonalPlanUpdateDto;
import me.verni.gymplify.dto.UserInPersonalPlanDto;
import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.repository.PersonalPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PersonalPlanService {
    private static final Logger log = LoggerFactory.getLogger(PersonalPlanService.class);

    private final PersonalPlanRepository personalPlanRepository;

    @Autowired
    public PersonalPlanService(PersonalPlanRepository personalPlanRepository) {
        this.personalPlanRepository = personalPlanRepository;
    }

    private void handleOperationFailedException(OperationFailedException e, String operation) {
        String message = e.getMessage();
        if (message != null) {
            if (message.contains("nie istnieje")) {
                throw new ResourceNotFoundException(message);
            } else if (message.contains("Nie znaleziono przypisania planu")) {
                throw new ResourceNotFoundException(message);
            }
        }
        log.error("OperationFailedException during {}: {}", operation, message, e);
        throw new DataConflictException("Operacja '" + operation + "' nie powiodła się: " + message, e);
    }

    @Transactional
    public PersonalPlanDto assignPlanToUser(PersonalPlanCreationDto dto) {
        try {
            Long personalPlanId = personalPlanRepository.assignPlanToUser(dto.getTrainerId(), dto.getUserId(), dto.getPlanId());
            return getPersonalPlanById(personalPlanId);
        } catch (OperationFailedException e) {
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.matches(".*Użytkownik ID \\d+ ma już przypisany plan od innego trenera.*")) {
                throw new DataConflictException(errorMessage.split("\\. ", 2)[0] + ".");
            } else if (errorMessage != null && errorMessage.contains("nieprawidłową rolę")) {
                throw new DataConflictException(errorMessage.split("\\. ", 2)[0] + ".");
            }
            handleOperationFailedException(e, "przypisanie planu do użytkownika");
            return null;
        }
    }

    @Transactional
    public void unassignPersonalPlanById(Long personalPlanId) {
        getPersonalPlanById(personalPlanId);
        try {
            personalPlanRepository.unassignPersonalPlanById(personalPlanId);
        } catch (OperationFailedException e) {
            handleOperationFailedException(e, "usunięcie przypisania personalnego planu (ID: " + personalPlanId + ")");
        }
    }

    @Transactional
    public void unassignPlanFromUser(Long userId, Long planId, Long trainerId) {
        try {
            personalPlanRepository.unassignPlanFromUser(userId, planId, trainerId);
        } catch (OperationFailedException e) {
            handleOperationFailedException(e, "usunięcie przypisania planu (user: " + userId + ", plan: " + planId + ")");
        }
    }

    @Transactional
    public PersonalPlanDto updatePersonalPlanAssignment(Long personalPlanId, PersonalPlanUpdateDto dto) {
        PersonalPlanDto existingPlan = getPersonalPlanById(personalPlanId);
        try {
            personalPlanRepository.updatePersonalPlanAssignment(personalPlanId, dto.getNewTrainerId(), dto.getNewPlanId());
            return getPersonalPlanById(personalPlanId);
        } catch (OperationFailedException e) {
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.matches(".*Użytkownik ID \\d+ ma już przypisany plan od innego trenera.*")) {
                throw new DataConflictException(errorMessage.split("\\. ", 2)[0] + ".");
            }
            handleOperationFailedException(e, "aktualizacja przypisania personalnego planu (ID: " + personalPlanId + ")");
            return null;
        }
    }

    public PersonalPlanDto getPersonalPlanById(Long personalPlanId) {
        try {
            return personalPlanRepository.getPersonalPlanById(personalPlanId)
                    .orElseThrow(() -> new ResourceNotFoundException("Personalny plan o ID " + personalPlanId + " nie istnieje."));
        } catch (OperationFailedException e) {
            handleOperationFailedException(e, "pobranie personalnego planu (ID: " + personalPlanId + ")");
            return null;
        }
    }

    public List<PersonalPlanDto> getPersonalPlansForUser(Long userId) {
        try {
            return personalPlanRepository.getPersonalPlansForUser(userId);
        } catch (OperationFailedException e) {
            handleOperationFailedException(e, "pobranie personalnych planów dla użytkownika (ID: " + userId + ")");
            return List.of();
        }
    }

    public List<UserInPersonalPlanDto> getUsersForPersonalPlanByPlanId(Long planId) {
        try {
            return personalPlanRepository.getUsersForPersonalPlanByPlanId(planId);
        } catch (OperationFailedException e) {
            handleOperationFailedException(e, "pobranie użytkowników dla planu (ID: " + planId + ")");
            return List.of();
        }
    }

    public List<PersonalPlanDto> listAllPersonalPlans() {
        try {
            return personalPlanRepository.listAllPersonalPlans();
        } catch (OperationFailedException e) {
            handleOperationFailedException(e, "listowanie wszystkich personalnych planów");
            return List.of();
        }
    }
}