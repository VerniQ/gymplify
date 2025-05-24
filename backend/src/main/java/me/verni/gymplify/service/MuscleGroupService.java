package me.verni.gymplify.service;

import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.dto.MuscleGroupDto;
import me.verni.gymplify.dto.MuscleGroupRequestDto;
import me.verni.gymplify.repository.MuscleGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MuscleGroupService {

    private final MuscleGroupRepository muscleGroupRepository;

    @Autowired
    public MuscleGroupService(MuscleGroupRepository muscleGroupRepository) {
        this.muscleGroupRepository = muscleGroupRepository;
    }

    public List<MuscleGroupDto> getAllMuscleGroups() {
        try {
            return muscleGroupRepository.findAll();
        } catch (OperationFailedException e) {
            throw e;
        } catch (Exception e) {
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas pobierania grup mięśniowych: " + e.getMessage(), e);
        }
    }

    public MuscleGroupDto getMuscleGroupById(Long id) {
        try {
            return muscleGroupRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Nie znaleziono grupy mięśniowej o ID: " + id));
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new OperationFailedException("Błąd podczas pobierania grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }

    public MuscleGroupDto addMuscleGroup(MuscleGroupRequestDto requestDto) {
        try {
            Long newGroupId = muscleGroupRepository.save(requestDto.getGroupName(), requestDto.getDescription());
            return getMuscleGroupById(newGroupId);
        } catch (DuplicateKeyException e) {
            throw new DataConflictException("Grupa mięśniowa o nazwie '" + requestDto.getGroupName() + "' już istnieje.", e);
        } catch (OperationFailedException e) {
            if (e.getMessage() != null &&
                    (e.getMessage().toLowerCase().contains("duplikat") ||
                            e.getMessage().toLowerCase().contains("grupa o nazwie już istnieje"))) {
                throw new DataConflictException("Grupa mięśniowa o nazwie '" + requestDto.getGroupName() + "' już istnieje.", e);
            }
            throw new OperationFailedException("Nie udało się dodać grupy mięśniowej: " + e.getMessage(), e);
        } catch (ResourceNotFoundException e) {
            throw new OperationFailedException("Błąd po dodaniu grupy: nie można odnaleźć nowo utworzonej grupy o ID: " + e.getMessage().replaceAll("[^0-9]", ""), e);
        } catch (Exception e) {
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas dodawania grupy mięśniowej: " + e.getMessage(), e);
        }
    }

    public MuscleGroupDto updateMuscleGroup(Long id, MuscleGroupRequestDto requestDto) {
        try {
            MuscleGroupDto existingGroup = getMuscleGroupById(id);
            boolean success = muscleGroupRepository.update(id, requestDto.getGroupName(), requestDto.getDescription());
            if (!success) {
                throw new OperationFailedException("Nie udało się zaktualizować grupy mięśniowej o ID: " + id + ". Procedura zgłosiła błąd.");
            }
            return getMuscleGroupById(id);
        } catch (DuplicateKeyException e) {
            throw new DataConflictException("Nie można zaktualizować grupy mięśniowej. Nazwa '" + requestDto.getGroupName() + "' prawdopodobnie już jest używana przez inną grupę.", e);
        } catch (ResourceNotFoundException | OperationFailedException | DataConflictException e) {
            throw e;
        } catch (Exception e) {
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas aktualizacji grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }

    public void deleteMuscleGroup(Long id) {
        try {
            getMuscleGroupById(id);
            boolean success = muscleGroupRepository.deleteById(id);
            if (!success) {
                throw new DataConflictException("Nie można usunąć grupy mięśniowej (ID: " + id + "). Możliwe, że istnieją powiązane ćwiczenia lub procedura zgłosiła błąd.");
            }
        } catch (ResourceNotFoundException | DataConflictException e) {
            throw e;
        } catch (Exception e) {
            throw new OperationFailedException("Wystąpił nieoczekiwany błąd podczas usuwania grupy mięśniowej o ID " + id + ": " + e.getMessage(), e);
        }
    }
}