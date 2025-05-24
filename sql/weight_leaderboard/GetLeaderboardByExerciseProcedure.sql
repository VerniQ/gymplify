CREATE OR REPLACE PROCEDURE prc_GetLeaderboardByExercise (
    p_exercise_id   IN weight_leaderboard.exercise_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT wl.result_id, wl.user_id, u.username, wl.exercise_id, e.name AS exercise_name, wl.measurement_date, wl.weight
        FROM weight_leaderboard wl
        JOIN users u ON wl.user_id = u.user_id
        JOIN exercises e ON wl.exercise_id = e.exercise_id
        WHERE wl.exercise_id = p_exercise_id
        ORDER BY wl.weight DESC, wl.measurement_date DESC;
END prc_GetLeaderboardByExercise;
/