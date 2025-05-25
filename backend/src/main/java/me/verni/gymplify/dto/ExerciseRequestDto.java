package me.verni.gymplify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseRequestDto {
    @NotBlank(message = "Nazwa ćwiczenia jest wymagana.")
    @Size(max = 255, message = "Nazwa ćwiczenia nie może przekraczać 255 znaków.")
    private String name;

    @Size(max = 4000, message = "Opis nie może przekraczać 4000 znaków.")
    private String description;

    private Long groupId;
}