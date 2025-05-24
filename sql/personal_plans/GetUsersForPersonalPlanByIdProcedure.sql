CREATE OR REPLACE PROCEDURE prc_GetUsersForPersonalPlanByPlanId (
    p_plan_id     IN personal_plans.plan_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT pp.personal_plan_id, pp.user_id, u.username, u.email, pp.trainer_id, t.name AS trainer_name, t.surname AS trainer_surname
        FROM personal_plans pp
        JOIN users u ON pp.user_id = u.user_id
        JOIN trainers t ON pp.trainer_id = t.trainer_id
        WHERE pp.plan_id = p_plan_id
        ORDER BY u.username;
END prc_GetUsersForPersonalPlanByPlanId;
/