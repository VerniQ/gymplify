CREATE OR REPLACE PROCEDURE UnassignPersonalPlanById (
    p_personal_plan_id IN personal_plans.personal_plan_id%TYPE
)
AS
BEGIN
    DELETE FROM personal_plans
    WHERE personal_plan_id = p_personal_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END UnassignPersonalPlanById;
/