CREATE OR REPLACE PROCEDURE prc_update_trainer(
    p_trainer_id IN NUMBER,
    p_name IN VARCHAR2,
    p_surname IN VARCHAR2,
    p_specialization IN VARCHAR2,
    p_contact IN VARCHAR2,
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

    UPDATE TRAINERS
    SET name = p_name,
        surname = p_surname,
        specialization = p_specialization,
        contact = p_contact
    WHERE trainer_id = p_trainer_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Dane trenera ID: ' || p_trainer_id || ' zostały zaktualizowane.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas aktualizacji trenera: ' || SQLERRM);
END prc_update_trainer;
/