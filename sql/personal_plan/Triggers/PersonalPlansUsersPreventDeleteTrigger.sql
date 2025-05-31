CREATE OR REPLACE TRIGGER trg_users_prevent_delete
    BEFORE DELETE ON USERS
    FOR EACH ROW
DECLARE
    v_personal_plan_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_personal_plan_count
    FROM personal_plans
    WHERE user_id = :OLD.user_id;

    IF v_personal_plan_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20006, 'Nie można usunąć użytkownika ID ' || :OLD.user_id || ', ponieważ jest przypisany do ' || v_personal_plan_count || ' osobistych planów treningowych.');
    END IF;
END;
/