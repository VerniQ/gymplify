CREATE OR REPLACE PROCEDURE prc_delete_muscle_group(
    p_group_id IN NUMBER,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
    v_exercises_count NUMBER;
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

    -- Sprawdź czy istnieją powiązane ćwiczenia
    SELECT COUNT(*)
    INTO v_exercises_count
    FROM EXERCISES
    WHERE group_id = p_group_id;

    IF v_exercises_count > 0 THEN
        DBMS_OUTPUT.PUT_LINE('Nie można usunąć grupy mięśniowej. Istnieją powiązane ćwiczenia (' || v_exercises_count || ').');
        RETURN;
    END IF;

    -- Usuń grupę mięśniową
    DELETE FROM MUSCLE_GROUPS
    WHERE group_id = p_group_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa ID: ' || p_group_id || ' została usunięta.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas usuwania grupy mięśniowej: ' || SQLERRM);
END prc_delete_muscle_group;
/