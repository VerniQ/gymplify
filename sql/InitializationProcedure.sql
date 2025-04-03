CREATE OR REPLACE PROCEDURE prc_initialize_database AS

    v_success BOOLEAN;

    FUNCTION fn_add_table(
        p_sql IN VARCHAR2,
        p_table_name VARCHAR2
    ) RETURN BOOLEAN IS
        temp NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO temp
        FROM USER_TABLES
        WHERE TABLE_NAME = UPPER(p_table_name);

        IF temp = 0 THEN
            EXECUTE IMMEDIATE p_sql;
            DBMS_OUTPUT.PUT_LINE('Table ' || p_table_name || ' successfully created.');
            RETURN TRUE;
        ELSE
            DBMS_OUTPUT.PUT_LINE('Table ' || p_table_name || ' already exists.');
            RETURN FALSE;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error creating table ' || p_table_name || ': ' || SQLERRM);
            RETURN FALSE;
    END fn_add_table;

BEGIN
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

    v_success := fn_add_table(
            'CREATE TABLE EXERCISES (
                exercise_id NUMBER PRIMARY KEY,
                name VARCHAR2(255),
                description CLOB,
                muscle_group VARCHAR2(100)
            )',
            'EXERCISES'
                 );

    v_success := fn_add_table(
            'CREATE TABLE TRAINING_PLANS (
                plan_id NUMBER PRIMARY KEY,
                name VARCHAR2(50)
            )',
            'TRAINING_PLANS'
                 );

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

    v_success := fn_add_table(
            'CREATE TABLE TRAINER_SESSIONS (
                schedule_id NUMBER PRIMARY KEY,
                trainer_id NUMBER,
                date DATE,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                CONSTRAINT fk_session_trainer FOREIGN KEY (trainer_id) REFERENCES TRAINERS(trainer_id)
            )',
            'TRAINER_SESSIONS'
                 );

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

    DBMS_OUTPUT.PUT_LINE('Database initialization completed.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error in database initialization: ' || SQLERRM);
END prc_initialize_database;
/