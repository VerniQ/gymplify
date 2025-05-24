package me.verni.gymplify.service;

import me.verni.gymplify.exception.DataConflictException;
import me.verni.gymplify.exception.OperationFailedException;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.dto.MuscleGroupDto;
import me.verni.gymplify.dto.MuscleGroupRequestDto;
import me.verni.gymplify.repository.MuscleGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        return muscleGroupRepository.findAll();
    }

    public MuscleGroupDto getMuscleGroupById(Long id) {
        return muscleGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nie znaleziono grupy mięśniowej o ID: " + id));
    }

    public MuscleGroupDto addMuscleGroup(MuscleGroupRequestDto requestDto) {
        Long newGroupId = muscleGroupRepository.save(requestDto.getGroupName(), requestDto.getDescription());
        return getMuscleGroupById(newGroupId);
    }

    public MuscleGroupDto updateMuscleGroup(Long id, MuscleGroupRequestDto requestDto) {
        getMuscleGroupById(id);
        boolean success = muscleGroupRepository.update(id, requestDto.getGroupName(), requestDto.getDescription());
        if (!success) {
            throw new OperationFailedException("Nie udało się zaktualizować grupy mięśniowej o ID: " + id);
        }
        return getMuscleGroupById(id);
    }

    public void deleteMuscleGroup(Long id) {
        getMuscleGroupById(id);
        boolean success = muscleGroupRepository.deleteById(id);
        if (!success) {
            throw new DataConflictException("Nie można usunąć grupy mięśniowej (ID: " + id + "). Możliwe, że istnieją powiązane ćwiczenia.");
        }
    }
}