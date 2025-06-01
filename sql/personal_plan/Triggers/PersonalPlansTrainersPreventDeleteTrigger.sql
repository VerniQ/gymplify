CREATE OR REPLACE TRIGGER trg_trainers_prevent_delete
    BEFORE DELETE
    ON TRAINERS
    FOR EACH ROW
DECLARE
    v_personal_plan_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_personal_plan_count
    FROM personal_plans
    WHERE trainer_id = :OLD.trainer_id;

    IF v_personal_plan_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20403,
                                'Nie można usunąć trenera ID ' || :OLD.trainer_id || ', ponieważ jest przypisany do ' ||
                                v_personal_plan_count || ' osobistych planów treningowych.');
    END IF;
END;
/