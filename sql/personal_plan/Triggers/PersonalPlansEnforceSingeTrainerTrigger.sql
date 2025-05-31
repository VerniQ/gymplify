CREATE OR REPLACE TRIGGER trg_personal_plans_enforce_single_trainer
    BEFORE INSERT OR UPDATE
    ON personal_plans
    FOR EACH ROW
DECLARE
    v_existing_trainer_id personal_plans.trainer_id%TYPE;
    v_trainer_count       NUMBER;
BEGIN
    IF :NEW.trainer_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT trainer_id)
        INTO v_trainer_count
        FROM personal_plans
        WHERE user_id = :NEW.user_id
          AND trainer_id IS NOT NULL
          AND trainer_id != :NEW.trainer_id;

        IF v_trainer_count > 0 THEN
            SELECT trainer_id
            INTO v_existing_trainer_id
            FROM personal_plans
            WHERE user_id = :NEW.user_id
              AND trainer_id IS NOT NULL
              AND trainer_id != :NEW.trainer_id
              AND ROWNUM = 1;

            RAISE_APPLICATION_ERROR(-20010, 'Użytkownik ID ' || :NEW.user_id ||
                                            ' ma już przypisany plan od innego trenera (ID ' || v_existing_trainer_id ||
                                            '). Nie można przypisać planu od trenera ID ' || :NEW.trainer_id || '.');
        END IF;
    END IF;
END;
/