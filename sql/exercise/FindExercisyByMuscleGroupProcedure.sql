CREATE OR REPLACE PROCEDURE prc_find_exercises_by_muscle_group(
    p_group_id IN NUMBER,
    p_exercises OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
    v_group_exists NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_group_exists
    FROM MUSCLE_GROUPS
    WHERE group_id = p_group_id;

    IF v_group_exists = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa o ID ' || p_group_id || ' nie istnieje.');
        RETURN;
    END IF;

    OPEN p_exercises FOR
        SELECT e.exercise_id, e.name, e.description, e.muscle_group
        FROM EXERCISES e
        WHERE e.group_id = p_group_id
        ORDER BY e.name;

    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Pobrano ćwiczenia dla grupy mięśniowej ID: ' || p_group_id);

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania ćwiczeń: ' || SQLERRM);
END prc_find_exercises_by_muscle_group;
/