CREATE OR REPLACE PROCEDURE prc_delete_trainer(
    p_trainer_id IN NUMBER,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_count
    FROM TRAINERS
    WHERE trainer_id = p_trainer_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' nie istnieje.');
        RETURN;
    END IF;

    SAVEPOINT before_delete;

    DELETE FROM TRAINER_SESSIONS
    WHERE trainer_id = p_trainer_id;

    DELETE FROM PERSONAL_PLANS
    WHERE trainer_id = p_trainer_id;

    DELETE FROM TRAINERS
    WHERE trainer_id = p_trainer_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' został pomyślnie usunięty.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK TO before_delete;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas usuwania trenera: ' || SQLERRM);
END prc_delete_trainer;
/