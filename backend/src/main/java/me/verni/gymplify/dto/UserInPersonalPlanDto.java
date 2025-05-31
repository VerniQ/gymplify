package me.verni.gymplify.dto;

public class UserInPersonalPlanDto {
    private Long personalPlanId;
    private Long userId;
    private String username;
    private String email;
    private Long trainerId;
    private String trainerName;
    private String trainerSurname;

    public UserInPersonalPlanDto() {}

    public UserInPersonalPlanDto(Long personalPlanId, Long userId, String username, String email, Long trainerId, String trainerName, String trainerSurname) {
        this.personalPlanId = personalPlanId;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.trainerSurname = trainerSurname;
    }

    public Long getPersonalPlanId() { return personalPlanId; }
    public void setPersonalPlanId(Long personalPlanId) { this.personalPlanId = personalPlanId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public String getTrainerName() { return trainerName; }
    public void setTrainerName(String trainerName) { this.trainerName = trainerName; }
    public String getTrainerSurname() { return trainerSurname; }
    public void setTrainerSurname(String trainerSurname) { this.trainerSurname = trainerSurname; }
}