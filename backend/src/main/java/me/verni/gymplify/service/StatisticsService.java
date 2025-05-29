package me.verni.gymplify.service;

import me.verni.gymplify.dto.statistics.*;
import me.verni.gymplify.exception.ResourceNotFoundException;
import me.verni.gymplify.repository.StatisticsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StatisticsService {
    private static final Logger logger = LoggerFactory.getLogger(StatisticsService.class);
    private final StatisticsRepository statisticsRepository;

    public StatisticsService(StatisticsRepository statisticsRepository) {
        this.statisticsRepository = statisticsRepository;
    }

    public Long getTotalUserCount() {
        logger.debug("Pobieranie całkowitej liczby użytkowników");
        return statisticsRepository.getTotalUserCount()
                .orElseThrow(() -> new ResourceNotFoundException("Nie udało się pobrać całkowitej liczby użytkowników."));
    }

    public List<RoleStatDto> getUserCountByRole() {
        logger.debug("Pobieranie liczby użytkowników po rolach");
        return statisticsRepository.getUserCountByRoleTyped();
    }

    public List<NewUserStatDto> getNewUsersByPeriod(LocalDate startDate, LocalDate endDate) {
        logger.debug("Pobieranie nowych użytkowników w okresie od {} do {}", startDate, endDate);
        return statisticsRepository.getNewUsersByPeriod(startDate, endDate);
    }


    public Long getTotalTrainerCount() {
        logger.debug("Pobieranie całkowitej liczby trenerów");
        return statisticsRepository.getTotalTrainerCount()
                .orElseThrow(() -> new ResourceNotFoundException("Nie udało się pobrać całkowitej liczby trenerów."));
    }

    public List<SpecializationStatDto> getTrainerCountBySpecialization() {
        logger.debug("Pobieranie liczby trenerów po specjalizacjach");
        return statisticsRepository.getTrainerCountBySpecializationTyped();
    }

    public List<TrainerWorkloadDto> getTrainerWorkloadStats() {
        logger.debug("Pobieranie statystyk obciążenia trenerów");
        return statisticsRepository.getTrainerWorkloadStatsTyped();
    }

    public List<ExercisePopularityDto> getMostPopularExercisesInPlans(int topN) {
        logger.debug("Pobieranie {} najpopularniejszych ćwiczeń w planach", topN);
        return statisticsRepository.getMostPopularExercisesInPlansTyped(topN);
    }

    public List<ExercisePopularityDto> getMostPopularExercisesInLeaderboard(int topN) {
        logger.debug("Pobieranie {} najpopularniejszych ćwiczeń w leaderboardach", topN);
        return statisticsRepository.getMostPopularExercisesInLeaderboardTyped(topN);
    }

    public List<LeaderboardRankingDto> getLeaderboardRankingsForExercise(Long exerciseId, int topN) {
        logger.debug("Pobieranie rankingów (top {}) dla ćwiczenia ID: {}", topN, exerciseId);
        return statisticsRepository.getLeaderboardRankingsForExercise(exerciseId, topN);
    }

    public List<SystemActivityCountDto> getOverallSystemActivityCounts() {
        logger.debug("Pobieranie ogólnych statystyk aktywności systemu");
        return statisticsRepository.getOverallSystemActivityCounts();
    }
}