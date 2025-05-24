CREATE OR REPLACE PROCEDURE GetExercisesForPlan (
    p_plan_id     IN training_exercise.plan_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT e.exercise_id, e.name, e.description, e.muscle_group
        FROM training_exercise te
        JOIN exercises e ON te.exercise_id = e.exercise_id
        WHERE te.plan_id = p_plan_id
        ORDER BY e.name;
END GetExercisesForPlan;
/