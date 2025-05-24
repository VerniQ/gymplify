CREATE OR REPLACE PROCEDURE prc_initialize_database AS
    v_success BOOLEAN;
    v_debug_msg VARCHAR2(4000);

    FUNCTION fn_add_table(
        p_sql IN VARCHAR2,
        p_table_name VARCHAR2
    ) RETURN BOOLEAN IS
        temp NUMBER;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Rozpoczęto dla tabeli: ' || p_table_name);
        BEGIN
            DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Sprawdzanie istnienia tabeli ' || UPPER(p_table_name) || ' w USER_TABLES...');
            SELECT COUNT(*)
            INTO temp
            FROM USER_TABLES
            WHERE TABLE_NAME = UPPER(p_table_name);
            DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Liczba dla ' || UPPER(p_table_name) || ' w USER_TABLES to: ' || temp);
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Błąd podczas zapytania do USER_TABLES dla ' || p_table_name || ': ' || SQLCODE || ' - ' || SQLERRM);
                RETURN FALSE;
        END;

        IF temp = 0 THEN
            DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Próba utworzenia tabeli ' || p_table_name);
            DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Fragment SQL: ' || SUBSTR(p_sql, 1, 1000));
            BEGIN
                EXECUTE IMMEDIATE p_sql;
                DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Tabela ' || p_table_name || ' utworzona pomyślnie.');
                RETURN TRUE;
            EXCEPTION
                WHEN OTHERS THEN
                    DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Błąd podczas EXECUTE IMMEDIATE dla tabeli ' || p_table_name || ': ' || SQLCODE || ' - ' || SQLERRM);
                    RETURN FALSE;
            END;
        ELSE
            DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Tabela ' || p_table_name || ' już istnieje.');
            RETURN FALSE;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('FN_ADD_TABLE: Nieoczekiwany błąd w fn_add_table dla ' || p_table_name || ': ' || SQLCODE || ' - ' || SQLERRM);
            RETURN FALSE;
    END fn_add_table;

BEGIN
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Rozpoczęto inicjalizację bazy danych...');

    v_success := fn_add_table(
            'CREATE TABLE USERS (
                user_id NUMBER PRIMARY KEY,
                username VARCHAR2(255),
                password_hash VARCHAR2(255),
                email VARCHAR2(255),
                role VARCHAR2(50),
                created_at TIMESTAMP
            )',
            'USERS'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia USERS: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE TRAINERS (
                trainer_id NUMBER PRIMARY KEY,
                user_id NUMBER,
                name VARCHAR2(255),
                surname VARCHAR2(255),
                specialization VARCHAR2(255),
                contact VARCHAR2(255),
                CONSTRAINT fk_trainer_user FOREIGN KEY (user_id) REFERENCES USERS(user_id)
            )',
            'TRAINERS'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia TRAINERS: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE EXERCISES (
                exercise_id NUMBER PRIMARY KEY,
                name VARCHAR2(255),
                description CLOB,
                muscle_group VARCHAR2(100)
            )',
            'EXERCISES'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia EXERCISES: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE TRAINING_PLANS (
                plan_id NUMBER PRIMARY KEY,
                name VARCHAR2(50)
            )',
            'TRAINING_PLANS'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia TRAINING_PLANS: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE PERSONAL_PLANS (
                personal_plan_id NUMBER PRIMARY KEY,
                trainer_id NUMBER,
                user_id NUMBER,
                plan_id NUMBER,
                CONSTRAINT fk_personal_plan_trainer FOREIGN KEY (trainer_id) REFERENCES TRAINERS(trainer_id),
                CONSTRAINT fk_personal_plan_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
                CONSTRAINT fk_personal_plan_plan FOREIGN KEY (plan_id) REFERENCES TRAINING_PLANS(plan_id)
            )',
            'PERSONAL_PLANS'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia PERSONAL_PLANS: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE TRAINING_EXERCISE (
                plan_id NUMBER,
                exercise_id NUMBER,
                PRIMARY KEY (plan_id, exercise_id),
                CONSTRAINT fk_training_exercise_plan FOREIGN KEY (plan_id) REFERENCES TRAINING_PLANS(plan_id),
                CONSTRAINT fk_training_exercise_exercise FOREIGN KEY (exercise_id) REFERENCES EXERCISES(exercise_id)
            )',
            'TRAINING_EXERCISE'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia TRAINING_EXERCISE: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE TRAINER_SESSIONS (
                schedule_id NUMBER PRIMARY KEY,
                trainer_id NUMBER,
                session_date DATE,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                CONSTRAINT fk_session_trainer FOREIGN KEY (trainer_id) REFERENCES TRAINERS(trainer_id)
            )',
            'TRAINER_SESSIONS'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia TRAINER_SESSIONS: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE WEIGHT_MEASUREMENTS (
                measurement_id NUMBER PRIMARY KEY,
                user_id NUMBER,
                measurement_date DATE,
                weight DECIMAL(5,2),
                CONSTRAINT fk_weight_user FOREIGN KEY (user_id) REFERENCES USERS(user_id)
            )',
            'WEIGHT_MEASUREMENTS'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia WEIGHT_MEASUREMENTS: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    v_success := fn_add_table(
            'CREATE TABLE WEIGHT_LEADERBOARD (
                result_id NUMBER PRIMARY KEY,
                user_id NUMBER,
                exercise_id NUMBER,
                measurement_date DATE,
                weight DECIMAL(5,2),
                CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
                CONSTRAINT fk_leaderboard_exercise FOREIGN KEY (exercise_id) REFERENCES EXERCISES(exercise_id)
            )',
            'WEIGHT_LEADERBOARD'
                 );
    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Wynik próby utworzenia WEIGHT_LEADERBOARD: ' || CASE WHEN v_success THEN 'Sukces' ELSE 'Porażka/Istnieje' END);

    DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Inicjalizacja bazy danych zakończona (lub podjęto próbę).');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('PRC_INITIALIZE_DATABASE: Nieoczekiwany błąd w głównym bloku PRC_INITIALIZE_DATABASE: ' || SQLCODE || ' - ' || SQLERRM);
END prc_initialize_database;
/