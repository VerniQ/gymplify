    CREATE OR REPLACE PACKAGE PKG_USER_MGMT AS

    PROCEDURE AddUser(
        p_username IN USERS.USERNAME%TYPE,
        p_password_hash IN USERS.PASSWORD_HASH%TYPE,
        p_email IN USERS.EMAIL%TYPE,
        p_role IN USERS.ROLE%TYPE,
        p_user_id OUT USERS.USER_ID%TYPE,
        p_success OUT BOOLEAN
    );

    PROCEDURE DeleteUser(
        p_user_id IN USERS.USER_ID%TYPE,
        p_success OUT BOOLEAN
    );

    PROCEDURE GetAllUsers(
        p_users_cursor OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    FUNCTION GetUserByEmailFunc (
        p_email IN USERS.EMAIL%TYPE
    ) RETURN SYS_REFCURSOR;

    PROCEDURE GetUserByEmailProc (
        p_email IN USERS.EMAIL%TYPE,
        p_user_cursor OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    PROCEDURE GetUserById(
        p_user_id IN USERS.USER_ID%TYPE,
        p_user_cursor OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    );

    PROCEDURE UpdateUserDetails(
        p_user_id IN USERS.USER_ID%TYPE,
        p_username IN USERS.USERNAME%TYPE,
        p_email IN USERS.EMAIL%TYPE,
        p_success OUT BOOLEAN
    );

    PROCEDURE UpdateUserRole(
        p_user_id IN USERS.USER_ID%TYPE,
        p_new_role IN USERS.ROLE%TYPE,
        p_success OUT BOOLEAN
    );

END PKG_USER_MGMT;
/
CREATE OR REPLACE PACKAGE BODY PKG_USER_MGMT AS

    PROCEDURE AddUser(
        p_username IN USERS.USERNAME%TYPE,
        p_password_hash IN USERS.PASSWORD_HASH%TYPE,
        p_email IN USERS.EMAIL%TYPE,
        p_role IN USERS.ROLE%TYPE,
        p_user_id OUT USERS.USER_ID%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_username_trimmed USERS.USERNAME%TYPE;
        v_email_trimmed USERS.EMAIL%TYPE;
        v_role_trimmed USERS.ROLE%TYPE;
    BEGIN
        p_success := FALSE;
        p_user_id := NULL;
        v_username_trimmed := TRIM(p_username);
        v_email_trimmed := LOWER(TRIM(p_email));
        v_role_trimmed := UPPER(TRIM(p_role));

        IF v_username_trimmed IS NULL OR LENGTH(v_username_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nazwa użytkownika nie może być pusta.');
            RETURN;
        END IF;
        IF v_email_trimmed IS NULL OR LENGTH(v_email_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Email nie może być pusty.');
            RETURN;
        END IF;

        p_user_id := users_seq.NEXTVAL;

        INSERT INTO USERS (user_id,
                           username,
                           password_hash,
                           email,
                           role,
                           created_at)
        VALUES (p_user_id,
                v_username_trimmed,
                p_password_hash,
                v_email_trimmed,
                v_role_trimmed,
                SYSTIMESTAMP);

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Użytkownik utworzony pomyślnie z ID: ' || p_user_id);
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            ROLLBACK;
            p_success := FALSE;
            p_user_id := NULL;
            DBMS_OUTPUT.PUT_LINE('Błąd: Nazwa użytkownika lub email już istnieje.');
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            p_user_id := NULL;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas tworzenia użytkownika: ' || SQLERRM);
            RAISE;
    END AddUser;

    PROCEDURE DeleteUser(
        p_user_id IN USERS.USER_ID%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_count      NUMBER;
        v_trainer_id TRAINERS.TRAINER_ID%TYPE;
    BEGIN
        p_success := FALSE;

        IF p_user_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID użytkownika nie może być puste.');
            RETURN;
        END IF;

        SELECT COUNT(*)
        INTO v_count
        FROM USERS
        WHERE user_id  = p_user_id;

        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' nie istnieje.');
            RETURN;
        END IF;

        SAVEPOINT before_delete_user_data;

        BEGIN
            SELECT trainer_id
            INTO v_trainer_id
            FROM TRAINERS
            WHERE user_id = p_user_id;

            IF v_trainer_id IS NOT NULL THEN
                DELETE FROM TRAINER_SESSIONS WHERE trainer_id = v_trainer_id;
                DELETE FROM PERSONAL_PLANS WHERE trainer_id = v_trainer_id;
                DELETE FROM TRAINERS WHERE trainer_id = v_trainer_id;
                DBMS_OUTPUT.PUT_LINE('Usunięto informacje o trenerze i powiązane dane dla user_id: ' || p_user_id);
            END IF;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                DBMS_OUTPUT.PUT_LINE('Użytkownik ID ' || p_user_id || ' nie jest trenerem.');
        END;

        DELETE FROM PERSONAL_PLANS WHERE user_id = p_user_id;
        DELETE FROM WEIGHT_MEASUREMENTS WHERE user_id = p_user_id;
        DELETE FROM WEIGHT_LEADERBOARD WHERE user_id = p_user_id;
        DELETE FROM USERS WHERE user_id = p_user_id;

        IF SQL%ROWCOUNT = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nie udało się usunąć użytkownika ID ' || p_user_id || ' (mógł zostać usunięty w międzyczasie).');
            ROLLBACK TO before_delete_user_data;
            RETURN;
        END IF;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' został pomyślnie usunięty.');

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO before_delete_user_data;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas usuwania użytkownika ID ' || p_user_id || ': ' || SQLERRM);
            DBMS_OUTPUT.PUT_LINE('Szczegóły błędu: ' || DBMS_UTILITY.FORMAT_ERROR_STACK);
            RAISE;
    END DeleteUser;

    PROCEDURE GetAllUsers(
        p_users_cursor OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
    BEGIN
        p_success := FALSE;
        OPEN p_users_cursor FOR
            SELECT user_id, username, email, role, password_hash, created_at
            FROM USERS
            ORDER BY username;
        p_success := TRUE;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            OPEN p_users_cursor FOR SELECT user_id, username, email, role, password_hash, created_at FROM USERS WHERE 1=0;
            p_success := TRUE;
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_users_cursor%ISOPEN THEN CLOSE p_users_cursor; END IF;
            OPEN p_users_cursor FOR SELECT user_id, username, email, role, password_hash, created_at FROM USERS WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd w GetAllUsers: ' || SQLERRM);
            RAISE;
    END GetAllUsers;

    FUNCTION GetUserByEmailFunc (
        p_email IN USERS.EMAIL%TYPE
    ) RETURN SYS_REFCURSOR
    AS
        c_user SYS_REFCURSOR;
        v_email_trimmed USERS.EMAIL%TYPE;
    BEGIN
        v_email_trimmed := LOWER(TRIM(p_email));
        OPEN c_user FOR
            SELECT user_id, username, email, role, password_hash, created_at
            FROM USERS WHERE email = v_email_trimmed;
        RETURN c_user;
    EXCEPTION
        WHEN OTHERS THEN
            IF c_user%ISOPEN THEN CLOSE c_user; END IF;
            OPEN c_user FOR SELECT user_id, username, email, role, password_hash, created_at FROM USERS WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd w GetUserByEmailFunc dla email ' || p_email || ': ' || SQLERRM);
            RETURN c_user;
    END GetUserByEmailFunc;

    PROCEDURE GetUserByEmailProc (
        p_email IN USERS.EMAIL%TYPE,
        p_user_cursor OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
        v_email_trimmed USERS.EMAIL%TYPE;
    BEGIN
        p_success := FALSE;
        v_email_trimmed := LOWER(TRIM(p_email));
        OPEN p_user_cursor FOR
            SELECT user_id, username, email, role, password_hash, created_at
            FROM USERS WHERE email = v_email_trimmed;
        p_success := TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_user_cursor%ISOPEN THEN CLOSE p_user_cursor; END IF;
            OPEN p_user_cursor FOR SELECT user_id, username, email, role, password_hash, created_at FROM USERS WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd w GetUserByEmailProc dla email ' || p_email || ': ' || SQLERRM);
            RAISE;
    END GetUserByEmailProc;

    PROCEDURE GetUserById(
        p_user_id IN USERS.USER_ID%TYPE,
        p_user_cursor OUT SYS_REFCURSOR,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
    BEGIN
        p_success := FALSE;
        IF p_user_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID użytkownika nie może być puste.');
            OPEN p_user_cursor FOR SELECT user_id, username, email, role, password_hash, created_at FROM USERS WHERE 1=0;
            RETURN;
        END IF;

        SELECT COUNT(*) INTO v_count FROM USERS WHERE user_id = p_user_id;
        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' nie istnieje.');
            OPEN p_user_cursor FOR SELECT user_id, username, email, role, password_hash, created_at FROM USERS WHERE 1=0;
            RETURN;
        END IF;

        OPEN p_user_cursor FOR
            SELECT user_id, username, email, role, password_hash, created_at
            FROM USERS
            WHERE user_id = p_user_id;
        p_success := TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := FALSE;
            IF p_user_cursor%ISOPEN THEN CLOSE p_user_cursor; END IF;
            OPEN p_user_cursor FOR SELECT user_id, username, email, role, password_hash, created_at FROM USERS WHERE 1=0;
            DBMS_OUTPUT.PUT_LINE('Błąd w GetUserById dla user ID ' || p_user_id || ': ' || SQLERRM);
            RAISE;
    END GetUserById;

    PROCEDURE UpdateUserDetails(
        p_user_id IN USERS.USER_ID%TYPE,
        p_username IN USERS.USERNAME%TYPE,
        p_email IN USERS.EMAIL%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
        v_username_trimmed USERS.USERNAME%TYPE;
        v_email_trimmed USERS.EMAIL%TYPE;
    BEGIN
        p_success := FALSE;
        v_username_trimmed := TRIM(p_username);
        v_email_trimmed := LOWER(TRIM(p_email));

        IF p_user_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID użytkownika nie może być puste.');
            RETURN;
        END IF;

        SELECT COUNT(*) INTO v_count FROM USERS WHERE user_id = p_user_id;
        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' nie istnieje.');
            RETURN;
        END IF;

        IF v_username_trimmed IS NULL OR LENGTH(v_username_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nowa nazwa użytkownika nie może być pusta.');
            RETURN;
        END IF;
        IF v_email_trimmed IS NULL OR LENGTH(v_email_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nowy email nie może być pusty.');
            RETURN;
        END IF;

        UPDATE USERS
        SET username = v_username_trimmed,
            email = v_email_trimmed
        WHERE user_id = p_user_id;

        IF SQL%NOTFOUND THEN
            DBMS_OUTPUT.PUT_LINE('Nie udało się zaktualizować użytkownika ID ' || p_user_id);
            ROLLBACK;
            RETURN;
        END IF;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Dane użytkownika ID ' || p_user_id || ' zaktualizowane.');
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            ROLLBACK;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd: Nowa nazwa użytkownika lub email już istnieje.');
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas aktualizacji danych użytkownika ID ' || p_user_id || ': ' || SQLERRM);
            RAISE;
    END UpdateUserDetails;

    PROCEDURE UpdateUserRole(
        p_user_id IN USERS.USER_ID%TYPE,
        p_new_role IN USERS.ROLE%TYPE,
        p_success OUT BOOLEAN
    ) AS
        v_count NUMBER;
        v_role_trimmed USERS.ROLE%TYPE;
    BEGIN
        p_success := FALSE;
        v_role_trimmed := UPPER(TRIM(p_new_role));

        IF p_user_id IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('ID użytkownika nie może być puste.');
            RETURN;
        END IF;
        IF v_role_trimmed IS NULL OR LENGTH(v_role_trimmed) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Nowa rola nie może być pusta.');
            RETURN;
        END IF;

        SELECT COUNT(*) INTO v_count FROM USERS WHERE user_id = p_user_id;
        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' nie istnieje.');
            RETURN;
        END IF;

        UPDATE USERS SET role = v_role_trimmed WHERE user_id = p_user_id;

        IF SQL%NOTFOUND THEN
            DBMS_OUTPUT.PUT_LINE('Nie udało się zaktualizować roli użytkownika ID ' || p_user_id);
            ROLLBACK;
            RETURN;
        END IF;

        COMMIT;
        p_success := TRUE;
        DBMS_OUTPUT.PUT_LINE('Rola dla użytkownika ID ' || p_user_id || ' zaktualizowana na ' || v_role_trimmed);
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := FALSE;
            DBMS_OUTPUT.PUT_LINE('Błąd podczas aktualizacji roli użytkownika ID ' || p_user_id || ': ' || SQLERRM);
            RAISE;
    END UpdateUserRole;

END PKG_USER_MGMT;
/