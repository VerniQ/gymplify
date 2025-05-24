CREATE SEQUENCE weight_leaderboard_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE CreateLeaderboardEntry (
    p_user_id           IN weight_leaderboard.user_id%TYPE,
    p_exercise_id       IN weight_leaderboard.exercise_id%TYPE,
    p_measurement_date  IN weight_leaderboard.measurement_date%TYPE,
    p_weight            IN weight_leaderboard.weight%TYPE,
    p_result_id         OUT weight_leaderboard.result_id%TYPE
)
AS
BEGIN
    INSERT INTO weight_leaderboard (result_id, user_id, exercise_id, measurement_date, weight)
    VALUES (weight_leaderboard_seq.NEXTVAL, p_user_id, p_exercise_id, p_measurement_date, p_weight)
    RETURNING result_id INTO p_result_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CreateLeaderboardEntry;
/