CREATE SEQUENCE personal_plans_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE prc_AssignPlanToUser (
    p_trainer_id  IN personal_plans.trainer_id%TYPE,
    p_user_id     IN personal_plans.user_id%TYPE,
    p_plan_id     IN personal_plans.plan_id%TYPE,
    p_personal_plan_id OUT personal_plans.personal_plan_id%TYPE
)
AS
BEGIN
    INSERT INTO personal_plans (personal_plan_id, trainer_id, user_id, plan_id)
    VALUES (personal_plans_seq.NEXTVAL, p_trainer_id, p_user_id, p_plan_id)
    RETURNING personal_plan_id INTO p_personal_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_AssignPlanToUser;
/