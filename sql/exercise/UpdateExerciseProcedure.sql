CREATE OR REPLACE PROCEDURE prc_update_exercise(
    p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
    p_name IN EXERCISES.NAME%TYPE,
    p_description IN EXERCISES.DESCRIPTION%TYPE,
    p_group_id IN EXERCISES.GROUP_ID%TYPE,
    p_success OUT BOOLEAN
) AS
    v_exercise_exists NUMBER;
    v_group_exists    NUMBER;
    v_name_trimmed    VARCHAR2(255);
BEGIN
    p_success := FALSE;

    IF p_exercise_id IS NULL THEN
        DBMS_OUTPUT.PUT_LINE('ID ćwiczenia (p_exercise_id) nie może być puste.');
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO v_exercise_exists
    FROM EXERCISES e
    WHERE e.exercise_id = p_exercise_id;

    IF v_exercise_exists = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje. Nie można zaktualizować.');
        RETURN;
    END IF;

    v_name_trimmed := TRIM(p_name);
    IF v_name_trimmed IS NULL OR LENGTH(v_name_trimmed) = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Nowa nazwa ćwiczenia (p_name) nie może być pusta.');
        RETURN;
    END IF;

    IF LENGTH(v_name_trimmed) > 255 THEN
        DBMS_OUTPUT.PUT_LINE('Nowa nazwa ćwiczenia (p_name) nie może przekraczać 255 znaków.');
        RETURN;
    END IF;

    IF p_description IS NOT NULL AND DBMS_LOB.GETLENGTH(p_description) > 4000 THEN
        DBMS_OUTPUT.PUT_LINE('Nowy opis ćwiczenia (p_description) nie może przekraczać 4000 znaków.');
        RETURN;
    END IF;

    IF p_group_id IS NULL THEN
        DBMS_OUTPUT.PUT_LINE('Nowe ID grupy mięśniowej (p_group_id) jest wymagane.');
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO v_group_exists
    FROM MUSCLE_GROUPS mg
    WHERE mg.group_id = p_group_id;

    IF v_group_exists = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Wybrana nowa grupa mięśniowa o ID ' || p_group_id || ' nie istnieje.');
        RETURN;
    END IF;

    UPDATE EXERCISES
    SET name         = v_name_trimmed,
        description  = p_description,
        group_id     = p_group_id
    WHERE exercise_id = p_exercise_id;

    IF SQL%NOTFOUND THEN
        DBMS_OUTPUT.PUT_LINE('Nie udało się zaktualizować ćwiczenia o ID ' || p_exercise_id || '. Rekord mógł zostać usunięty przez inną sesję.');
        ROLLBACK;
        RETURN;
    END IF;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' zostało pomyślnie zaktualizowane.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd Oracle podczas aktualizacji ćwiczenia: ' || SQLCODE || ' - ' || SQLERRM);
END prc_update_exercise;
/