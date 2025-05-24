CREATE OR REPLACE PROCEDURE GetPersonalPlanById (
    p_personal_plan_id IN personal_plans.personal_plan_id%TYPE,
    p_record_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_record_cursor FOR
        SELECT pp.personal_plan_id, pp.user_id, u.username, pp.trainer_id, t.name AS trainer_name, t.surname as trainer_surname, pp.plan_id, tp.name AS plan_name
        FROM personal_plans pp
        JOIN users u ON pp.user_id = u.user_id
        JOIN trainers t ON pp.trainer_id = t.trainer_id
        JOIN training_plans tp ON pp.plan_id = tp.plan_id
        WHERE pp.personal_plan_id = p_personal_plan_id;
END GetPersonalPlanById;
/