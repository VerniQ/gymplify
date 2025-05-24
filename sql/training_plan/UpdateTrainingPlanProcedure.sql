CREATE OR REPLACE PROCEDURE UpdateTrainingPlan (
    p_plan_id     IN training_plans.plan_id%TYPE,
    p_name        IN training_plans.name%TYPE
)
AS
BEGIN
    UPDATE training_plans
    SET name = p_name
    WHERE plan_id = p_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END UpdateTrainingPlan;
/