package me.verni.gymplify.dto;

import jakarta.validation.constraints.NotNull;

public class PersonalPlanCreationDto {
    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @NotNull(message = "Trainer ID cannot be null")
    private Long trainerId;

    @NotNull(message = "Plan ID cannot be null")
    private Long planId;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
}