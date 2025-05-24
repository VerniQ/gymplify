CREATE OR REPLACE PROCEDURE prc_GetPersonalPlansForUser (
    p_user_id     IN personal_plans.user_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT pp.personal_plan_id, pp.user_id, u.username, pp.trainer_id, t.name AS trainer_name, t.surname AS trainer_surname, pp.plan_id, tp.name AS plan_name
        FROM personal_plans pp
        JOIN users u ON pp.user_id = u.user_id
        JOIN trainers t ON pp.trainer_id = t.trainer_id
        JOIN training_plans tp ON pp.plan_id = tp.plan_id
        WHERE pp.user_id = p_user_id
        ORDER BY tp.name;
END prc_GetPersonalPlansForUser;
/