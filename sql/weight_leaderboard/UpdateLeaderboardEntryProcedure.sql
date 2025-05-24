CREATE OR REPLACE PROCEDURE prc_UpdateLeaderboardEntry (
    p_result_id         IN weight_leaderboard.result_id%TYPE,
    p_exercise_id       IN weight_leaderboard.exercise_id%TYPE,
    p_measurement_date  IN weight_leaderboard.measurement_date%TYPE,
    p_weight            IN weight_leaderboard.weight%TYPE
)
AS
BEGIN
    UPDATE weight_leaderboard
    SET exercise_id = p_exercise_id,
        measurement_date = p_measurement_date,
        weight = p_weight
    WHERE result_id = p_result_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_UpdateLeaderboardEntry;
/