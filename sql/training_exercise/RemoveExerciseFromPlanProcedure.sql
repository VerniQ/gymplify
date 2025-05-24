CREATE OR REPLACE PROCEDURE RemoveExerciseFromPlan (
    p_plan_id     IN training_exercise.plan_id%TYPE,
    p_exercise_id IN training_exercise.exercise_id%TYPE
)
AS
BEGIN
    DELETE FROM training_exercise
    WHERE plan_id = p_plan_id AND exercise_id = p_exercise_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END RemoveExerciseFromPlan;
/