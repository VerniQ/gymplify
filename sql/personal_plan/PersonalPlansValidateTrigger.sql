CREATE OR REPLACE TRIGGER trg_personal_plans_validate
BEFORE INSERT OR UPDATE ON personal_plans
FOR EACH ROW
DECLARE
    v_user_count NUMBER;
    v_trainer_count NUMBER;
    v_plan_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM USERS WHERE user_id = :NEW.user_id;
    IF v_user_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Użytkownik o ID ' || :NEW.user_id || ' nie istnieje.');
    END IF;

    SELECT COUNT(*) INTO v_trainer_count FROM TRAINERS WHERE trainer_id = :NEW.trainer_id;
    IF v_trainer_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20400, 'Trener o ID ' || :NEW.trainer_id || ' nie istnieje.');
    END IF;

    SELECT COUNT(*) INTO v_plan_count FROM TRAINING_PLANS WHERE plan_id = :NEW.plan_id;
    IF v_plan_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || :NEW.plan_id || ' nie istnieje.');
    END IF;
END;
/