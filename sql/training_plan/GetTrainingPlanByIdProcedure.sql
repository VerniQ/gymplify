CREATE OR REPLACE PROCEDURE prc_GetTrainingPlanById (
    p_plan_id     IN training_plans.plan_id%TYPE,
    p_record_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_record_cursor FOR
        SELECT plan_id, name
        FROM training_plans
        WHERE plan_id = p_plan_id;
END prc_GetTrainingPlanById;
/