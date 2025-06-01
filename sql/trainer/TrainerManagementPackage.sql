CREATE OR REPLACE PACKAGE PKG_TRAINER_MGMT AS

    PROCEDURE CreateTrainer(
        p_user_id IN USERS.USER_ID%TYPE,
        p_name IN TRAINERS.NAME%TYPE,
        p_surname IN TRAINERS.SURNAME%TYPE,
        p_specialization IN TRAINERS.SPECIALIZATION%TYPE,
        p_contact IN TRAINERS.CONTACT%TYPE,
        p_trainer_id OUT TRAINERS.TRAINER_ID%TYPE,
        p_success OUT BOOLEAN
    );

    PROCEDURE DeleteTrainer(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_success OUT BOOLEAN
    );

    PROCEDURE FindTrainersBySpecialization(
        p_specialization IN TRAINERS.SPECIALIZATION%TYPE,
        p_trainers OUT SYS_REFCURSOR
    );

    PROCEDURE GetTrainerCount(
        p_count OUT NUMBER
    );

    PROCEDURE GetTrainerDetails(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_trainer_data OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    PROCEDURE GetTrainerSessions(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_from_date IN DATE DEFAULT SYSDATE-30,
        p_to_date IN DATE DEFAULT SYSDATE+30,
        p_sessions OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    PROCEDURE GetAllTrainers(
        p_trainers OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    PROCEDURE UpdateTrainer(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_name IN TRAINERS.NAME%TYPE,
        p_surname IN TRAINERS.SURNAME%TYPE,
        p_specialization IN TRAINERS.SPECIALIZATION%TYPE,
        p_contact IN TRAINERS.CONTACT%TYPE,
        p_success OUT BOOLEAN
    );

END PKG_TRAINER_MGMT;
/
CREATE OR REPLACE PACKAGE BODY PKG_TRAINER_MGMT AS

    PROCEDURE CreateTrainer(
        p_user_id IN USERS.USER_ID%TYPE,
        p_name IN TRAINERS.NAME%TYPE,
        p_surname IN TRAINERS.SURNAME%TYPE,
        p_specialization IN TRAINERS.SPECIALIZATION%TYPE,
        p_contact IN TRAINERS.CONTACT%TYPE,
        p_trainer_id OUT TRAINERS.TRAINER_ID%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
        v_name_trimmed TRAINERS.NAME%TYPE;
        v_surname_trimmed TRAINERS.SURNAME%TYPE;
    BEGIN
        p_success := FALSE;
        p_trainer_id := NULL;
        v_name_trimmed := TRIM(p_name);
        v_surname_trimmed := TRIM(p_surname);

        IF p_user_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID użytkownika (p_user_id) nie może być puste.');
            RETURN;
        END IF;

        IF v_name_trimmed IS NULL OR LENGTH(v_name_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Imię trenera (p_name) nie może być puste.');
            RETURN;
        END IF;

        IF v_surname_trimmed IS NULL OR LENGTH(v_surname_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nazwisko trenera (p_surname) nie może być puste.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM USERS
        WHERE user_id = p_user_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' nie istnieje.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM TRAINERS
        WHERE user_id = p_user_id;

        IF v_count > 0 THEN
            DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' jest już trenerem.');
            RETURN;
        END IF;

        INSERT INTO TRAINERS (trainer_id, user_id, name, surname, specialization, contact)
        VALUES (trainers_seq.NEXTVAL, p_user_id, v_name_trimmed, v_surname_trimmed, p_specialization, p_contact)
        RETURNING trainer_id INTO p_trainer_id;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Trener został pomyślnie dodany z ID: ' || p_trainer_id);

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            p_trainer_id := NULL;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas dodawania trenera: ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END CreateTrainer;

    PROCEDURE DeleteTrainer(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
    BEGIN
        p_success := FALSE;

        IF p_trainer_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID trenera (p_trainer_id) nie może być puste.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM TRAINERS
        WHERE trainer_id = p_trainer_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' nie istnieje.');
            RETURN;
        END IF;

        SAVEPOINT before_delete_trainer_data;

        DELETE FROM TRAINER_SESSIONS
        WHERE trainer_id = p_trainer_id;
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' sesji usuniętych dla trenera ID ' || p_trainer_id);

        DELETE FROM PERSONAL_PLANS
        WHERE trainer_id = p_trainer_id;
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' planów osobistych usuniętych dla trenera ID ' || p_trainer_id);

        DELETE FROM TRAINERS
        WHERE trainer_id = p_trainer_id;

        IF SQL%ROWCOUNT = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nie udało się usunąć trenera ID ' || p_trainer_id || ' (mógł zostać usunięty w międzyczasie).');
            ROLLBACK TO before_delete_trainer_data;
            RETURN;
        END IF;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' został pomyślnie usunięty.');

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO before_delete_trainer_data;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas usuwania trenera ID ' || p_trainer_id || ': ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END DeleteTrainer;

    PROCEDURE FindTrainersBySpecialization(
        p_specialization IN TRAINERS.SPECIALIZATION%TYPE,
        p_trainers OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_trainers FOR
            SELECT t.trainer_id, t.name, t.surname, t.specialization, t.contact, t.user_id, u.username, u.email
            FROM TRAINERS t
            JOIN USERS u ON t.user_id = u.user_id
            WHERE UPPER(t.specialization) LIKE '%' || UPPER(TRIM(p_specialization)) || '%'
            ORDER BY t.surname, t.name;

        DBMS_OUTPUT.PUT_LINE('Wyszukano trenerów o specjalizacji podobnej do: ' || TRIM(p_specialization));
    EXCEPTION
        WHEN OTHERS THEN
            IF p_trainers%ISOPEN THEN CLOSE p_trainers; END IF;
            OPEN p_trainers FOR SELECT NULL AS trainer_id FROM DUAL WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas wyszukiwania trenerów: ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END FindTrainersBySpecialization;

    PROCEDURE GetTrainerCount(
        p_count OUT NUMBER
    ) AS
    BEGIN
        SELECT COUNT(*)
        INTO p_count
        FROM TRAINERS;
        DBMS_OUTPUT.PUT_LINE('Liczba trenerów: ' || p_count);
    EXCEPTION
        WHEN OTHERS THEN
            p_count := 0;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania liczby trenerów: ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END GetTrainerCount;

    PROCEDURE GetTrainerDetails(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_trainer_data OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
    BEGIN
        p_success := FALSE;

        IF p_trainer_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID trenera (p_trainer_id) nie może być puste.');
            OPEN p_trainer_data FOR SELECT NULL AS trainer_id FROM DUAL WHERE 1=0;
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM TRAINERS
        WHERE trainer_id = p_trainer_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' nie istnieje.');
            OPEN p_trainer_data FOR SELECT NULL AS trainer_id FROM DUAL WHERE 1=0;
            RETURN;
        END IF;

        OPEN p_trainer_data FOR
            SELECT t.trainer_id, t.user_id, t.name, t.surname, t.specialization, t.contact,
                   u.username, u.email
            FROM TRAINERS t
            JOIN USERS u ON t.user_id = u.user_id
            WHERE t.trainer_id = p_trainer_id;

        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Pobrano dane trenera ID ' || p_trainer_id);
    EXCEPTION
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_trainer_data%ISOPEN THEN CLOSE p_trainer_data; END IF;
            OPEN p_trainer_data FOR SELECT NULL AS trainer_id FROM DUAL WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania danych trenera ID ' || p_trainer_id || ': ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END GetTrainerDetails;

    PROCEDURE GetTrainerSessions(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_from_date IN DATE DEFAULT SYSDATE-30,
        p_to_date IN DATE DEFAULT SYSDATE+30,
        p_sessions OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
    BEGIN
        p_success := FALSE;

        IF p_trainer_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID trenera (p_trainer_id) nie może być puste.');
            OPEN p_sessions FOR SELECT NULL AS schedule_id FROM DUAL WHERE 1=0;
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM trainers
        WHERE trainer_id = p_trainer_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' nie istnieje.');
            OPEN p_sessions FOR SELECT NULL AS schedule_id FROM DUAL WHERE 1=0;
            RETURN;
        END IF;

        OPEN p_sessions FOR
            SELECT
                ts.schedule_id,
                ts.trainer_id,
                t.name AS trainer_name,          -- ZMIANA: Dodane
                t.surname AS trainer_surname,    -- ZMIANA: Dodane
                ts.session_date,
                ts.start_time,
                ts.end_time
            FROM
                trainer_sessions ts
            JOIN
                trainers t ON ts.trainer_id = t.trainer_id -- ZMIANA: Dodany JOIN
            WHERE
                ts.trainer_id = p_trainer_id
                AND ts.session_date BETWEEN TRUNC(p_from_date) AND TRUNC(p_to_date)
            ORDER BY
                ts.session_date, ts.start_time;

        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Pobrano sesje dla trenera ID ' || p_trainer_id);
    EXCEPTION
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_sessions%ISOPEN THEN CLOSE p_sessions; END IF;
            OPEN p_sessions FOR SELECT NULL AS schedule_id FROM DUAL WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania sesji trenera ID ' || p_trainer_id || ': ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END GetTrainerSessions;

    PROCEDURE GetAllTrainers(
        p_trainers OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
    BEGIN
        p_success := FALSE;
        OPEN p_trainers FOR
            SELECT t.trainer_id,
                   t.user_id,
                   t.name,
                   t.surname,
                   t.specialization,
                   t.contact,
                   u.username,
                   u.email
            FROM TRAINERS t
            JOIN USERS u ON t.user_id = u.user_id
            ORDER BY t.surname, t.name;

        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Lista trenerów została pobrana.');
    EXCEPTION
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_trainers%ISOPEN THEN CLOSE p_trainers; END IF;
            OPEN p_trainers FOR SELECT NULL AS trainer_id FROM DUAL WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania listy trenerów: ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END GetAllTrainers;

    PROCEDURE UpdateTrainer(
        p_trainer_id IN TRAINERS.TRAINER_ID%TYPE,
        p_name IN TRAINERS.NAME%TYPE,
        p_surname IN TRAINERS.SURNAME%TYPE,
        p_specialization IN TRAINERS.SPECIALIZATION%TYPE,
        p_contact IN TRAINERS.CONTACT%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
        v_name_trimmed TRAINERS.NAME%TYPE;
        v_surname_trimmed TRAINERS.SURNAME%TYPE;
    BEGIN
        p_success := FALSE;
        v_name_trimmed := TRIM(p_name);
        v_surname_trimmed := TRIM(p_surname);

        IF p_trainer_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID trenera (p_trainer_id) nie może być puste.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM TRAINERS
        WHERE trainer_id = p_trainer_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' nie istnieje.');
            RETURN;
        END IF;

        IF v_name_trimmed IS NULL OR LENGTH(v_name_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nowe imię trenera (p_name) nie może być puste.');
            RETURN;
        END IF;

        IF v_surname_trimmed IS NULL OR LENGTH(v_surname_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nowe nazwisko trenera (p_surname) nie może być puste.');
            RETURN;
        END IF;

        UPDATE TRAINERS
        SET name = v_name_trimmed,
            surname = v_surname_trimmed,
            specialization = p_specialization,
            contact = p_contact
        WHERE trainer_id = p_trainer_id;

        IF SQL%NOTFOUND THEN
             DBMS_OUTPUT.PUT_LINE('Nie udało się zaktualizować trenera ID: ' || p_trainer_id || ' (mógł zostać usunięty w międzyczasie).');
             ROLLBACK;
             RETURN;
        END IF;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Dane trenera ID: ' || p_trainer_id || ' zostały zaktualizowane.');
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas aktualizacji trenera ID ' || p_trainer_id || ': ' || SQLCODE || ' - ' || SQLERRM);
            RAISE;
    END UpdateTrainer;

END PKG_TRAINER_MGMT;
/