package me.verni.gymplify.dto;

public class PersonalPlanDto {
    private Long personalPlanId;
    private Long userId;
    private String username;
    private Long trainerId;
    private String trainerName;
    private String trainerSurname;
    private Long planId;
    private String planName;

    public PersonalPlanDto() {
    }

    public PersonalPlanDto(Long personalPlanId, Long userId, String username, Long trainerId, String trainerName, String trainerSurname, Long planId, String planName) {
        this.personalPlanId = personalPlanId;
        this.userId = userId;
        this.username = username;
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.trainerSurname = trainerSurname;
        this.planId = planId;
        this.planName = planName;
    }

    public Long getPersonalPlanId() { return personalPlanId; }
    public void setPersonalPlanId(Long personalPlanId) { this.personalPlanId = personalPlanId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public String getTrainerName() { return trainerName; }
    public void setTrainerName(String trainerName) { this.trainerName = trainerName; }
    public String getTrainerSurname() { return trainerSurname; }
    public void setTrainerSurname(String trainerSurname) { this.trainerSurname = trainerSurname; }
    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }
}