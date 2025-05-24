CREATE OR REPLACE PROCEDURE prc_get_muscle_group_by_id(
    p_group_id IN NUMBER,
    p_muscle_group OUT SYS_REFCURSOR,
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

    OPEN p_muscle_group FOR
        SELECT group_id, group_name, description
        FROM MUSCLE_GROUPS
        WHERE group_id = p_group_id;

    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Pobrano grupę mięśniową ID: ' || p_group_id);

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania grupy mięśniowej: ' || SQLERRM);
END prc_get_muscle_group_by_id;
/