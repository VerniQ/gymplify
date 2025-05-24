CREATE OR REPLACE PROCEDURE ListAllLeaderboardEntries (
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT wl.result_id, wl.user_id, u.username, wl.exercise_id, e.name AS exercise_name, wl.measurement_date, wl.weight
        FROM weight_leaderboard wl
        JOIN users u ON wl.user_id = u.user_id
        JOIN exercises e ON wl.exercise_id = e.exercise_id
        ORDER BY e.name, wl.weight DESC, wl.measurement_date DESC;
END ListAllLeaderboardEntries;
/