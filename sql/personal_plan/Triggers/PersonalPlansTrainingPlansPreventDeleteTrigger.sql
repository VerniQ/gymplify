CREATE OR REPLACE TRIGGER trg_training_plans_prevent_delete
    BEFORE DELETE
    ON TRAINING_PLANS
    FOR EACH ROW
DECLARE
    v_personal_plan_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_personal_plan_count
    FROM personal_plans
    WHERE plan_id = :OLD.plan_id;

    IF v_personal_plan_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20301, 'Nie można usunąć planu treningowego ID ' || :OLD.plan_id ||
                                        ', ponieważ jest używany w ' || v_personal_plan_count ||
                                        ' osobistych planach treningowych.');
    END IF;
END;
/