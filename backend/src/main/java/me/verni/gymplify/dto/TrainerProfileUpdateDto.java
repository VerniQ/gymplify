package me.verni.gymplify.dto;

public class TrainerProfileUpdateDto {
    private String name;
    private String surname;
    private String specialization;
    private String contact;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
}