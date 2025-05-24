CREATE OR REPLACE PROCEDURE RemoveAllExercisesFromPlan (
    p_plan_id     IN training_exercise.plan_id%TYPE
)
AS
BEGIN
    DELETE FROM training_exercise
    WHERE plan_id = p_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END RemoveAllExercisesFromPlan;
/