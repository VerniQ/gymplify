
CREATE SEQUENCE exercises_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE prc_create_exercise(
    p_name IN VARCHAR2,
    p_description IN CLOB,
    p_muscle_group IN VARCHAR2,
    p_group_id IN NUMBER DEFAULT NULL,  -- Dodany nowy parametr z wartością domyślną
    p_exercise_id OUT NUMBER,
    p_success OUT BOOLEAN
) AS
    v_group_exists NUMBER;
BEGIN
    p_success := FALSE;

    -- Sprawdzenie czy grupa mięśniowa istnieje
    IF p_group_id IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_group_exists
        FROM muscle_groups
        WHERE group_id = p_group_id;

        IF v_group_exists = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Wybrana grupa mięśniowa nie istnieje.');
            RETURN;
        END IF;
    END IF;

    -- Używanie sekwencji zamiast MAX+1
    p_exercise_id := exercises_seq.NEXTVAL;

    -- Wstawianie nowego ćwiczenia
    INSERT INTO exercises(exercise_id, name, description, muscle_group, group_id)
    VALUES(p_exercise_id, p_name, p_description, p_muscle_group, p_group_id);

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Ćwiczenie zostało pomyślnie utworzone z ID: ' || p_exercise_id);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas tworzenia ćwiczenia: ' || SQLERRM);
END prc_create_exercise;
/