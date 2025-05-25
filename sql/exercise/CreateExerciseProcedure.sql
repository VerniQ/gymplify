CREATE OR REPLACE PROCEDURE prc_create_exercise(
    p_name IN EXERCISES.NAME%TYPE,
    p_description IN EXERCISES.DESCRIPTION%TYPE,
    p_group_id IN EXERCISES.GROUP_ID%TYPE DEFAULT NULL,
    p_exercise_id OUT EXERCISES.EXERCISE_ID%TYPE,
    p_success OUT BOOLEAN
) AS
    v_group_exists NUMBER;
    v_name_trimmed VARCHAR2(255);
BEGIN
    p_success := FALSE;
    p_exercise_id := NULL;
    v_name_trimmed := TRIM(p_name);

    IF v_name_trimmed IS NULL OR LENGTH(v_name_trimmed) = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Nazwa ćwiczenia (p_name) nie może być pusta.');
        RETURN;
    END IF;

    IF LENGTH(v_name_trimmed) > 255 THEN
        DBMS_OUTPUT.PUT_LINE('Nazwa ćwiczenia (p_name) nie może przekraczać 255 znaków.');
        RETURN;
    END IF;

    IF p_description IS NOT NULL AND DBMS_LOB.GETLENGTH(p_description) > 4000 THEN
        DBMS_OUTPUT.PUT_LINE('Opis ćwiczenia (p_description) nie może przekraczać 4000 znaków.');
        RETURN;
    END IF;

    IF p_group_id IS NULL THEN
        DBMS_OUTPUT.PUT_LINE('ID grupy mięśniowej (p_group_id) jest wymagane.');
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO v_group_exists
    FROM MUSCLE_GROUPS mg
    WHERE mg.group_id = p_group_id;

    IF v_group_exists = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Wybrana grupa mięśniowa o ID ' || p_group_id || ' nie istnieje.');
        RETURN;
    END IF;

    p_exercise_id := exercises_seq.NEXTVAL;

    INSERT INTO exercises (exercise_id, name, description, group_id)
    VALUES (p_exercise_id, v_name_trimmed, p_description, p_group_id);

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Ćwiczenie zostało pomyślnie utworzone z ID: ' || p_exercise_id);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        p_exercise_id := NULL;
        DBMS_OUTPUT.PUT_LINE('Błąd Oracle podczas tworzenia ćwiczenia: ' || SQLCODE || ' - ' || SQLERRM);
END prc_create_exercise;
/