CREATE OR REPLACE PACKAGE PKG_MUSCLE_GROUP_MGMT AS

    PROCEDURE AddMuscleGroup(
        p_group_name IN MUSCLE_GROUPS.GROUP_NAME%TYPE,
        p_description IN MUSCLE_GROUPS.DESCRIPTION%TYPE,
        p_new_group_id OUT MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_success OUT BOOLEAN
    );

    PROCEDURE DeleteMuscleGroup(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_success OUT BOOLEAN
    );

    PROCEDURE GetAllMuscleGroups(
        p_muscle_groups OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    PROCEDURE GetMuscleGroupById(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_muscle_group OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    PROCEDURE UpdateMuscleGroup(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_group_name IN MUSCLE_GROUPS.GROUP_NAME%TYPE,
        p_description IN MUSCLE_GROUPS.DESCRIPTION%TYPE DEFAULT NULL,
        p_success OUT BOOLEAN
    );

END PKG_MUSCLE_GROUP_MGMT;
/
CREATE OR REPLACE PACKAGE BODY PKG_MUSCLE_GROUP_MGMT AS

    PROCEDURE AddMuscleGroup(
        p_group_name IN MUSCLE_GROUPS.GROUP_NAME%TYPE,
        p_description IN MUSCLE_GROUPS.DESCRIPTION%TYPE,
        p_new_group_id OUT MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_generated_id NUMBER;
    BEGIN
        p_success := FALSE;
        p_new_group_id := NULL;

        IF TRIM(p_group_name) IS NULL OR LENGTH(TRIM(p_group_name)) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nazwa grupy mięśniowej (p_group_name) nie może być pusta.');
            RETURN;
        END IF;

        IF LENGTH(TRIM(p_group_name)) > 255 THEN
            DBMS_OUTPUT.PUT_LINE('Nazwa grupy mięśniowej (p_group_name) nie może przekraczać 255 znaków.');
            RETURN;
        END IF;

        v_generated_id := muscle_groups_seq.NEXTVAL;

        INSERT INTO MUSCLE_GROUPS (
            group_id,
            group_name,
            description
        ) VALUES (
            v_generated_id,
            TRIM(p_group_name),
            p_description
        );

        COMMIT;
        p_new_group_id := v_generated_id;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa "' || TRIM(p_group_name) || '" została dodana z ID: ' || v_generated_id);

    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            ROLLBACK;
            p_success := FALSE;
            p_new_group_id := NULL;
            DBMS_OUTPUT.PUT_LINE('Błąd PL/SQL: Grupa mięśniowa o nazwie "' || TRIM(p_group_name) || '" już istnieje. (ORA-00001)');
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            p_new_group_id := NULL;
            DBMS_OUTPUT.PUT_LINE('Błąd PL/SQL podczas dodawania grupy mięśniowej: ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END AddMuscleGroup;

    PROCEDURE DeleteMuscleGroup(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
        v_exercises_count NUMBER;
    BEGIN
        p_success := FALSE;

        IF p_group_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID grupy mięśniowej (p_group_id) nie może być puste.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM MUSCLE_GROUPS
        WHERE group_id = p_group_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa z ID ' || p_group_id || ' nie istnieje.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_exercises_count
        FROM EXERCISES
        WHERE group_id = p_group_id;

        IF v_exercises_count > 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nie można usunąć grupy mięśniowej. Istnieją powiązane ćwiczenia (' || v_exercises_count || ').');
            RETURN;
        END IF;

        DELETE FROM MUSCLE_GROUPS
        WHERE group_id = p_group_id;

        IF SQL%ROWCOUNT = 0 THEN
             DBMS_OUTPUT.PUT_LINE('Nie udało się usunąć grupy mięśniowej ID: ' || p_group_id || ' (mogła zostać usunięta w międzyczasie).');
             ROLLBACK;
             RETURN;
        END IF;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa ID: ' || p_group_id || ' została usunięta.');

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas usuwania grupy mięśniowej ID ' || p_group_id || ': ' || SQLERRM);
    END DeleteMuscleGroup;

    PROCEDURE GetAllMuscleGroups(
        p_muscle_groups OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
    BEGIN
        p_success := FALSE;

        OPEN p_muscle_groups FOR
            SELECT group_id, group_name, description
            FROM MUSCLE_GROUPS
            ORDER BY group_name;

        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Lista grup mięśniowych została pobrana.');

    EXCEPTION
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_muscle_groups%ISOPEN THEN
                CLOSE p_muscle_groups;
            END IF;
            BEGIN
                OPEN p_muscle_groups FOR SELECT NULL AS group_id, NULL AS group_name, NULL AS description FROM DUAL WHERE 1=0;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania listy grup mięśniowych: ' || SQLERRM);
    END GetAllMuscleGroups;

    PROCEDURE GetMuscleGroupById(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_muscle_group OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
    BEGIN
        p_success := FALSE;

        IF p_group_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID grupy mięśniowej (p_group_id) nie może być puste.');
            OPEN p_muscle_group FOR SELECT NULL AS group_id, NULL AS group_name, NULL AS description FROM DUAL WHERE 1=0;
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM MUSCLE_GROUPS
        WHERE group_id = p_group_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa z ID ' || p_group_id || ' nie istnieje.');
            OPEN p_muscle_group FOR SELECT NULL AS group_id, NULL AS group_name, NULL AS description FROM DUAL WHERE 1=0;
            RETURN;
        END IF;

        OPEN p_muscle_group FOR
            SELECT group_id, group_name, description
            FROM MUSCLE_GROUPS
            WHERE group_id = p_group_id;

        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Pobrano grupę mięśniową ID: ' || p_group_id);

    EXCEPTION
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_muscle_group%ISOPEN THEN
                CLOSE p_muscle_group;
            END IF;
            BEGIN
                OPEN p_muscle_group FOR SELECT NULL AS group_id, NULL AS group_name, NULL AS description FROM DUAL WHERE 1=0;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania grupy mięśniowej ID ' || p_group_id || ': ' || SQLERRM);
    END GetMuscleGroupById;

    PROCEDURE UpdateMuscleGroup(
        p_group_id IN MUSCLE_GROUPS.GROUP_ID%TYPE,
        p_group_name IN MUSCLE_GROUPS.GROUP_NAME%TYPE,
        p_description IN MUSCLE_GROUPS.DESCRIPTION%TYPE DEFAULT NULL,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
        v_name_trimmed MUSCLE_GROUPS.GROUP_NAME%TYPE;
    BEGIN
        p_success := FALSE;
        v_name_trimmed := TRIM(p_group_name);

        IF p_group_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID grupy mięśniowej (p_group_id) nie może być puste.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM MUSCLE_GROUPS
        WHERE group_id = p_group_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa z ID ' || p_group_id || ' nie istnieje.');
            RETURN;
        END IF;

        IF v_name_trimmed IS NULL OR LENGTH(v_name_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nowa nazwa grupy mięśniowej (p_group_name) nie może być pusta.');
            RETURN;
        END IF;

        IF LENGTH(v_name_trimmed) > 255 THEN
            DBMS_OUTPUT.PUT_LINE('Nowa nazwa grupy mięśniowej (p_group_name) nie może przekraczać 255 znaków.');
            RETURN;
        END IF;

        UPDATE MUSCLE_GROUPS
        SET group_name = v_name_trimmed,
            description = p_description
        WHERE group_id = p_group_id;

        IF SQL%ROWCOUNT = 0 THEN
             DBMS_OUTPUT.PUT_LINE('Nie udało się zaktualizować grupy mięśniowej ID: ' || p_group_id || ' (mogła zostać usunięta w międzyczasie).');
             ROLLBACK;
             RETURN;
        END IF;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa ID: ' || p_group_id || ' została zaktualizowana.');

    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            ROLLBACK;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd PL/SQL: Grupa mięśniowa o nazwie "' || v_name_trimmed || '" już istnieje. (ORA-00001)');
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas aktualizacji grupy mięśniowej ID ' || p_group_id || ': ' || SQLERRM);
    END UpdateMuscleGroup;

END PKG_MUSCLE_GROUP_MGMT;
/