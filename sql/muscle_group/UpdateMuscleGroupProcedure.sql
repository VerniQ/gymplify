CREATE OR REPLACE PROCEDURE prc_update_muscle_group(
    p_group_id IN NUMBER,
    p_group_name IN VARCHAR2,
    p_description IN CLOB DEFAULT NULL,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    -- Sprawdź czy grupa mięśniowa istnieje
    SELECT COUNT(*)
    INTO v_count
    FROM MUSCLE_GROUPS
    WHERE group_id = p_group_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa z ID ' || p_group_id || ' nie istnieje.');
        RETURN;
    END IF;

    -- Aktualizuj grupę mięśniową
    UPDATE MUSCLE_GROUPS
    SET group_name = p_group_name,
        description = p_description
    WHERE group_id = p_group_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa ID: ' || p_group_id || ' została zaktualizowana.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas aktualizacji grupy mięśniowej: ' || SQLERRM);
END prc_update_muscle_group;
/