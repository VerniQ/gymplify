CREATE OR REPLACE PROCEDURE prc_DeleteLeaderboardEntry (
    p_result_id IN weight_leaderboard.result_id%TYPE
)
AS
BEGIN
    DELETE FROM weight_leaderboard
    WHERE result_id = p_result_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_DeleteLeaderboardEntry;
/