CREATE OR REPLACE PROCEDURE prc_get_exercise_details(
    p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
    p_exercise_data OUT SYS_REFCURSOR,
    p_success OUT NUMBER
) AS
    v_count NUMBER;
BEGIN
    p_success := 0;

    SELECT COUNT(*)
    INTO v_count
    FROM EXERCISES e
    WHERE e.exercise_id = p_exercise_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
        OPEN p_exercise_data FOR SELECT NULL AS exercise_id FROM DUAL WHERE 1=0;
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

    p_success := 1;

EXCEPTION
    WHEN OTHERS THEN
        p_success := 0;
        IF p_exercise_data%ISOPEN THEN
            CLOSE p_exercise_data;
        END IF;
        BEGIN
            OPEN p_exercise_data FOR SELECT NULL AS exercise_id FROM DUAL WHERE 1=0;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania szczegółów ćwiczenia: ' || SQLERRM);
END prc_get_exercise_details;
/