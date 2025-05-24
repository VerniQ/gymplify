CREATE OR REPLACE PROCEDURE prc_GetPlansForExercise (
    p_exercise_id IN training_exercise.exercise_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT tp.plan_id, tp.name
        FROM training_exercise te
        JOIN training_plans tp ON te.plan_id = tp.plan_id
        WHERE te.exercise_id = p_exercise_id
        ORDER BY tp.name;
END prc_GetPlansForExercise;
/