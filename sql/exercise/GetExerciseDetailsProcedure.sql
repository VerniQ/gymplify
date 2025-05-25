CREATE OR REPLACE PROCEDURE prc_get_exercise_details(
    p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
    p_exercise_data OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_count
    FROM EXERCISES e
    WHERE e.exercise_id = p_exercise_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
        RETURN;
    END IF;

    OPEN p_exercise_data FOR
        SELECT
            e.exercise_id,
            e.name,
            e.description,
            e.group_id,
            mg.group_name
        FROM
            EXERCISES e
                LEFT JOIN MUSCLE_GROUPS mg ON e.group_id = mg.group_id
        WHERE
            e.exercise_id = p_exercise_id;

    p_success := TRUE;

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        IF p_exercise_data%ISOPEN THEN
            CLOSE p_exercise_data;
        END IF;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania szczegółów ćwiczenia: ' || SQLERRM);
END prc_get_exercise_details;
/