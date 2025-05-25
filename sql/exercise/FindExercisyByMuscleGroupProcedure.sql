CREATE OR REPLACE PROCEDURE prc_find_exercises_by_muscle_group(
    p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
    p_exercises OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
    v_group_exists NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_group_exists
    FROM MUSCLE_GROUPS mg
    WHERE mg.group_id = p_group_id;

    IF v_group_exists = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa o ID ' || p_group_id || ' nie istnieje.');
        RETURN;
    END IF;

    OPEN p_exercises FOR
        SELECT
            e.exercise_id,
            e.name,
            e.description,
            e.group_id,
            mg.group_name
        FROM
            EXERCISES e
                JOIN MUSCLE_GROUPS mg ON e.group_id = mg.group_id
        WHERE
            e.group_id = p_group_id
        ORDER BY
            e.name;

    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Pobrano ćwiczenia dla grupy mięśniowej ID: ' || p_group_id);

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        IF p_exercises%ISOPEN THEN
            CLOSE p_exercises;
        END IF;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania ćwiczeń dla grupy: ' || SQLERRM);
END prc_find_exercises_by_muscle_group;
/