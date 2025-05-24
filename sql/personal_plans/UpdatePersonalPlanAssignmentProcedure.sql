CREATE OR REPLACE PROCEDURE prc_UpdatePersonalPlanAssignment (
    p_personal_plan_id IN personal_plans.personal_plan_id%TYPE,
    p_trainer_id  IN personal_plans.trainer_id%TYPE,
    p_plan_id     IN personal_plans.plan_id%TYPE
)
AS
BEGIN
    UPDATE personal_plans
    SET trainer_id = p_trainer_id,
        plan_id = p_plan_id
    WHERE personal_plan_id = p_personal_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_UpdatePersonalPlanAssignment;
/