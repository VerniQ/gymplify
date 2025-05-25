package me.verni.gymplify.dto;

public class TrainerAdminViewDto {
    private Long trainerId;
    private Long userId;
    private String name;
    private String surname;
    private String specialization;
    private String contact;
    private String username;
    private String email;

    public TrainerAdminViewDto(Long trainerId, Long userId, String name, String surname, String specialization, String contact, String username, String email) {
        this.trainerId = trainerId;
        this.userId = userId;
        this.name = name;
        this.surname = surname;
        this.specialization = specialization;
        this.contact = contact;
        this.username = username;
        this.email = email;
    }

    public Long getTrainerId() { return trainerId; }
    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public String getSurname() { return surname; }
    public String getSpecialization() { return specialization; }
    public String getContact() { return contact; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
}