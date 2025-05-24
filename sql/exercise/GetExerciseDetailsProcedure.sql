CREATE OR REPLACE PROCEDURE prc_get_exercise_details(
    p_exercise_id IN NUMBER,
    p_exercise_data OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_count
    FROM exercises
    WHERE exercise_id = p_exercise_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
        RETURN;
    END IF;

    OPEN p_exercise_data FOR
        SELECT exercise_id, name, description, muscle_group
        FROM exercises
        WHERE exercise_id = p_exercise_id;

    p_success := TRUE;

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania szczegółów ćwiczenia: ' || SQLERRM);
END prc_get_exercise_details;
/