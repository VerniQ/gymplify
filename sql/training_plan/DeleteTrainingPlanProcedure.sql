CREATE OR REPLACE PROCEDURE prc_DeleteTrainingPlan (
    p_plan_id     IN training_plans.plan_id%TYPE
)
AS
BEGIN
    DELETE FROM training_exercise WHERE plan_id = p_plan_id;

    DELETE FROM personal_plans WHERE plan_id = p_plan_id;

    DELETE FROM training_plans
    WHERE plan_id = p_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_DeleteTrainingPlan;
/