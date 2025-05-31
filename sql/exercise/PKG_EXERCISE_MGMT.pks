CREATE OR REPLACE PACKAGE PKG_EXERCISE_MGMT AS

    PROCEDURE CreateExercise(
        p_name IN EXERCISES.NAME%TYPE,
        p_description IN EXERCISES.DESCRIPTION%TYPE,
        p_group_id IN EXERCISES.GROUP_ID%TYPE,
        p_exercise_id OUT EXERCISES.EXERCISE_ID%TYPE,
        p_success OUT NUMBER
    );

    PROCEDURE DeleteExercise(
        p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
        p_success OUT NUMBER
    );

    PROCEDURE FindExercisesByMuscleGroup(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_exercises OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    );

    PROCEDURE GetExerciseDetails(
        p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
        p_exercise_data OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    );

    PROCEDURE GetAllExercises(
        p_exercises OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    );

    PROCEDURE UpdateExercise(
        p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
        p_name IN EXERCISES.NAME%TYPE,
        p_description IN EXERCISES.DESCRIPTION%TYPE,
        p_group_id IN EXERCISES.GROUP_ID%TYPE,
        p_success OUT NUMBER
    );

END PKG_EXERCISE_MGMT;
/
CREATE OR REPLACE PACKAGE BODY PKG_EXERCISE_MGMT AS

    PROCEDURE CreateExercise(
        p_name IN EXERCISES.NAME%TYPE,
        p_description IN EXERCISES.DESCRIPTION%TYPE,
        p_group_id IN EXERCISES.GROUP_ID%TYPE,
        p_exercise_id OUT EXERCISES.EXERCISE_ID%TYPE,
        p_success OUT NUMBER
    ) AS
        v_group_exists NUMBER;
        v_name_trimmed VARCHAR2(255);
    BEGIN
        p_success := 0;
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
        p_success := 1;
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie zostało pomyślnie utworzone z ID: ' || p_exercise_id);

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := 0;
            p_exercise_id := NULL;
            DBMS_OUTPUT.PUT_LINE('Błąd Oracle podczas tworzenia ćwiczenia: ' || SQLCODE || ' - ' || SQLERRM);
    END CreateExercise;

    PROCEDURE DeleteExercise(
        p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
        p_success OUT NUMBER
    ) AS
        v_count NUMBER;
    BEGIN
        p_success := 0;

        SELECT COUNT(*)
        INTO v_count
        FROM exercises
        WHERE exercise_id = p_exercise_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
            RETURN;
        END IF;

        DELETE FROM training_exercise
        WHERE exercise_id = p_exercise_id;
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' wierszy usuniętych z training_exercise dla exercise_id: ' || p_exercise_id);

        DELETE FROM weight_leaderboard
        WHERE exercise_id = p_exercise_id;
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' wierszy usuniętych z weight_leaderboard dla exercise_id: ' || p_exercise_id);

        DELETE FROM exercises
        WHERE exercise_id = p_exercise_id;
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' wierszy usuniętych z exercises dla exercise_id: ' || p_exercise_id);

        IF SQL%ROWCOUNT = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nie udało się usunąć ćwiczenia o ID ' || p_exercise_id || ' z tabeli exercises (mogło zostać usunięte w międzyczasie).');
            ROLLBACK;
            p_success := 0;
            RETURN;
        END IF;

        COMMIT;
        p_success := 1;
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' zostało pomyślnie usunięte.');

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := 0;
            DBMS_OUTPUT.PUT_LINE('Błąd SQL podczas usuwania ćwiczenia ID ' || p_exercise_id || ': ' || SQLCODE || ' - ' || SQLERRM);
    END DeleteExercise;

    PROCEDURE FindExercisesByMuscleGroup(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_exercises OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    ) AS
        v_group_exists NUMBER;
    BEGIN
        p_success := 0;

        SELECT COUNT(*)
        INTO v_group_exists
        FROM MUSCLE_GROUPS mg
        WHERE mg.group_id = p_group_id;

        IF v_group_exists = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa o ID ' || p_group_id || ' nie istnieje.');
            OPEN p_exercises FOR SELECT NULL AS exercise_id, NULL AS name, NULL AS description, NULL AS group_id, NULL AS group_name FROM DUAL WHERE 1=0;
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

        p_success := 1;
        DBMS_OUTPUT.PUT_LINE('Pobrano ćwiczenia dla grupy mięśniowej ID: ' || p_group_id);

    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            IF p_exercises%ISOPEN THEN
                CLOSE p_exercises;
            END IF;
            BEGIN
                OPEN p_exercises FOR SELECT NULL AS exercise_id, NULL AS name, NULL AS description, NULL AS group_id, NULL AS group_name FROM DUAL WHERE 1=0;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania ćwiczeń dla grupy: ' || SQLERRM);
    END FindExercisesByMuscleGroup;

    PROCEDURE GetExerciseDetails(
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
            OPEN p_exercise_data FOR SELECT NULL AS exercise_id, NULL AS name, NULL AS description, NULL AS group_id, NULL AS group_name FROM DUAL WHERE 1=0;
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
                OPEN p_exercise_data FOR SELECT NULL AS exercise_id, NULL AS name, NULL AS description, NULL AS group_id, NULL AS group_name FROM DUAL WHERE 1=0;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania szczegółów ćwiczenia: ' || SQLERRM);
    END GetExerciseDetails;

    PROCEDURE GetAllExercises(
        p_exercises OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    ) AS
    BEGIN
        p_success := 0;

        OPEN p_exercises FOR
            SELECT
                e.exercise_id,
                e.name,
                e.description,
                e.group_id,
                mg.group_name
            FROM
                EXERCISES e
                    LEFT JOIN MUSCLE_GROUPS mg ON e.group_id = mg.group_id
            ORDER BY
                e.name;

        p_success := 1;
        DBMS_OUTPUT.PUT_LINE('Lista ćwiczeń została pobrana.');

    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            IF p_exercises%ISOPEN THEN
                CLOSE p_exercises;
            END IF;
            BEGIN
                 OPEN p_exercises FOR SELECT NULL AS exercise_id, NULL AS name, NULL AS description, NULL AS group_id, NULL AS group_name FROM DUAL WHERE 1=0;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania listy ćwiczeń: ' || SQLERRM);
    END GetAllExercises;

    PROCEDURE UpdateExercise(
        p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
        p_name IN EXERCISES.NAME%TYPE,
        p_description IN EXERCISES.DESCRIPTION%TYPE,
        p_group_id IN EXERCISES.GROUP_ID%TYPE,
        p_success OUT NUMBER
    ) AS
        v_exercise_exists NUMBER;
        v_group_exists    NUMBER;
        v_name_trimmed    VARCHAR2(255);
    BEGIN
        p_success := 0;

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
             DBMS_OUTPUT.PUT_LINE('Nowy opis ćwiczenia (p_description) nie może przekraczać 4000 znaków dla typu VARCHAR2 lub standardowej obsługi CLOB w tym kontekście.');
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
        p_success := 1;
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' zostało pomyślnie zaktualizowane.');

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := 0;
            DBMS_OUTPUT.PUT_LINE('Błąd Oracle podczas aktualizacji ćwiczenia ID ' || p_exercise_id || ': ' || SQLCODE || ' - ' || SQLERRM);
    END UpdateExercise;

END PKG_EXERCISE_MGMT;
/