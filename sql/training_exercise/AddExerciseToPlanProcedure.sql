CREATE OR REPLACE PROCEDURE prc_AddExerciseToPlan (
    p_plan_id     IN training_exercise.plan_id%TYPE,
    p_exercise_id IN training_exercise.exercise_id%TYPE
)
AS
BEGIN
    INSERT INTO training_exercise (plan_id, exercise_id)
    VALUES (p_plan_id, p_exercise_id);
    COMMIT;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        NULL;
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_AddExerciseToPlan;
/