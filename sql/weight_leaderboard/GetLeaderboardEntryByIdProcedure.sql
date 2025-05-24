CREATE OR REPLACE PROCEDURE GetLeaderboardEntryById (
    p_result_id     IN weight_leaderboard.result_id%TYPE,
    p_record_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_record_cursor FOR
        SELECT wl.result_id, wl.user_id, u.username, wl.exercise_id, e.name AS exercise_name, wl.measurement_date, wl.weight
        FROM weight_leaderboard wl
        JOIN users u ON wl.user_id = u.user_id
        JOIN exercises e ON wl.exercise_id = e.exercise_id
        WHERE wl.result_id = p_result_id;
END GetLeaderboardEntryById;
/