CREATE SEQUENCE training_plans_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE CreateTrainingPlan (
    p_name        IN training_plans.name%TYPE,
    p_plan_id     OUT training_plans.plan_id%TYPE
)
AS
BEGIN
    INSERT INTO training_plans (plan_id, name)
    VALUES (training_plans_seq.NEXTVAL, p_name)
    RETURNING plan_id INTO p_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CreateTrainingPlan;
/