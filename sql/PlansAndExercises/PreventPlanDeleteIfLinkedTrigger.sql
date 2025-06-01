CREATE OR REPLACE TRIGGER trg_prevent_plan_delete_if_linked
    BEFORE DELETE
    ON training_plans
    FOR EACH ROW
DECLARE
    v_exercise_count      NUMBER;
    v_personal_plan_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_exercise_count
    FROM training_exercise
    WHERE plan_id = :OLD.plan_id;

    IF v_exercise_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20303, 'Nie można usunąć planu treningowego ID ' || :OLD.plan_id ||
                                        '. Najpierw usuń wszystkie przypisane do niego ćwiczenia (' ||
                                        v_exercise_count || ').');
    END IF;

    SELECT COUNT(*)
    INTO v_personal_plan_count
    FROM personal_plans
    WHERE plan_id = :OLD.plan_id;

    IF v_personal_plan_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20304, 'Nie można usunąć planu treningowego ID ' || :OLD.plan_id ||
                                        '. Jest on przypisany do użytkowników (' || v_personal_plan_count || ').');
    END IF;
END;
/