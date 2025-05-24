CREATE OR REPLACE PROCEDURE ListAllTrainingPlans (
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT plan_id, name
        FROM training_plans
        ORDER BY name;
END ListAllTrainingPlans;
/