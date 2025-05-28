package me.verni.gymplify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTrainingPlanRequestDto {

    @NotBlank(message = "Nazwa planu treningowego nie może być pusta.")
    @Size(min = 2, max = 50, message = "Nazwa planu treningowego musi mieć od 2 do 50 znaków.")
    private String name;
}