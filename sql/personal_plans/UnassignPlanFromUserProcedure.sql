CREATE OR REPLACE PROCEDURE prc_UnassignPlanFromUser (
    p_user_id     IN personal_plans.user_id%TYPE,
    p_plan_id     IN personal_plans.plan_id%TYPE,
    p_trainer_id  IN personal_plans.trainer_id%TYPE DEFAULT NULL
)
AS
BEGIN
    DELETE FROM personal_plans
    WHERE user_id = p_user_id
      AND plan_id = p_plan_id
      AND (p_trainer_id IS NULL OR trainer_id = p_trainer_id);
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_UnassignPlanFromUser;
/