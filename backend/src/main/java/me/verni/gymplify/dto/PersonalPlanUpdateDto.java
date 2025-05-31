package me.verni.gymplify.dto;

import jakarta.validation.constraints.NotNull;

public class PersonalPlanUpdateDto {
    @NotNull(message = "Trener ID nie może być pusty")
    private Long newTrainerId;

    @NotNull(message = "Plan ID nie może być pusty")
    private Long newPlanId;

    public Long getNewTrainerId() { return newTrainerId; }
    public void setNewTrainerId(Long newTrainerId) { this.newTrainerId = newTrainerId; }
    public Long getNewPlanId() { return newPlanId; }
    public void setNewPlanId(Long newPlanId) { this.newPlanId = newPlanId; }
}