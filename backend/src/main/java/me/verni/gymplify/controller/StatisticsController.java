package me.verni.gymplify.controller;

import me.verni.gymplify.dto.statistics.*; // Importuje wszystkie DTO z tego pakietu
import me.verni.gymplify.service.StatisticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsController.class);
    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/users/total-count")
    public ResponseEntity<Long> getTotalUserCount() {
        logger.info("GET /api/statistics/users/total-count");
        return ResponseEntity.ok(statisticsService.getTotalUserCount());
    }

    @GetMapping("/users/by-role")
    public ResponseEntity<List<RoleStatDto>> getUserCountByRole() {
        logger.info("GET /api/statistics/users/by-role");
        return ResponseEntity.ok(statisticsService.getUserCountByRole());
    }

    @GetMapping("/users/new-by-period")
    public ResponseEntity<List<NewUserStatDto>> getNewUsersByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        logger.info("GET /api/statistics/users/new-by-period?startDate={}&endDate={}", startDate, endDate);
        return ResponseEntity.ok(statisticsService.getNewUsersByPeriod(startDate, endDate));
    }

    @GetMapping("/trainers/total-count")
    public ResponseEntity<Long> getTotalTrainerCount() {
        logger.info("GET /api/statistics/trainers/total-count");
        return ResponseEntity.ok(statisticsService.getTotalTrainerCount());
    }

    @GetMapping("/trainers/by-specialization")
    public ResponseEntity<List<SpecializationStatDto>> getTrainerCountBySpecialization() {
        logger.info("GET /api/statistics/trainers/by-specialization");
        return ResponseEntity.ok(statisticsService.getTrainerCountBySpecialization());
    }

    @GetMapping("/trainers/workload")
    public ResponseEntity<List<TrainerWorkloadDto>> getTrainerWorkloadStats() {
        logger.info("GET /api/statistics/trainers/workload");
        return ResponseEntity.ok(statisticsService.getTrainerWorkloadStats());
    }

    @GetMapping("/exercises/count-by-muscle-group")
    public ResponseEntity<List<ExerciseCountByMuscleGroupDto>> getExerciseCountByMuscleGroup() {
        logger.info("GET /api/statistics/exercises/count-by-muscle-group");
        return ResponseEntity.ok(statisticsService.getExerciseCountByMuscleGroup());
    }

    @GetMapping("/exercises/popular-in-plans")
    public ResponseEntity<List<ExercisePopularityDto>> getMostPopularExercisesInPlans(
            @RequestParam(defaultValue = "10") int topN) {
        logger.info("GET /api/statistics/exercises/popular-in-plans?topN={}", topN);
        return ResponseEntity.ok(statisticsService.getMostPopularExercisesInPlans(topN));
    }

    @GetMapping("/training-plans/most-assigned")
    public ResponseEntity<List<PopularPlanDto>> getMostAssignedTrainingPlans(
            @RequestParam(defaultValue = "5") int topN) {
        logger.info("GET /api/statistics/training-plans/most-assigned?topN={}", topN);
        return ResponseEntity.ok(statisticsService.getMostAssignedTrainingPlans(topN));
    }

    @GetMapping("/system/activity-counts")
    public ResponseEntity<List<SystemActivityCountDto>> getOverallSystemActivityCounts() {
        logger.info("GET /api/statistics/system/activity-counts");
        return ResponseEntity.ok(statisticsService.getOverallSystemActivityCounts());
    }
}