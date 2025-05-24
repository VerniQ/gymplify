CREATE OR REPLACE PROCEDURE prc_update_exercise(
    p_exercise_id IN NUMBER,
    p_name IN VARCHAR2,
    p_description IN CLOB,
    p_muscle_group IN VARCHAR2,
    p_group_id IN NUMBER DEFAULT NULL,  -- Dodany parametr grupy mięśniowej
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
    v_group_exists NUMBER := 1;
BEGIN
    p_success := FALSE;

    -- Sprawdź czy ćwiczenie istnieje
    SELECT COUNT(*)
    INTO v_count
    FROM EXERCISES
    WHERE exercise_id = p_exercise_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie z ID ' || p_exercise_id || ' nie istnieje.');
        RETURN;
    END IF;

    -- Sprawdzenie czy grupa mięśniowa istnieje
    IF p_group_id IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_group_exists
        FROM MUSCLE_GROUPS
        WHERE group_id = p_group_id;

        IF v_group_exists = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Wybrana grupa mięśniowa nie istnieje.');
            RETURN;
        END IF;
    END IF;

    -- Aktualizuj ćwiczenie
    UPDATE EXERCISES
    SET name = p_name,
        description = p_description,
        muscle_group = p_muscle_group,
        group_id = p_group_id
    WHERE exercise_id = p_exercise_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Ćwiczenie ID: ' || p_exercise_id || ' zostało zaktualizowane.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas aktualizacji ćwiczenia: ' || SQLERRM);
END prc_update_exercise;
/