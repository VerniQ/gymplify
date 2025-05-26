CREATE OR REPLACE PACKAGE PKG_TRAINING_PLAN_MGMT AS

    TYPE ty_training_plan_record IS RECORD (
        plan_id   training_plans.plan_id%TYPE,
        name      training_plans.name%TYPE
    );
    TYPE ty_training_plan_table IS TABLE OF ty_training_plan_record INDEX BY PLS_INTEGER;

    TYPE ty_exercise_in_plan_record IS RECORD (
         exercise_id      exercises.exercise_id%TYPE,
         name             exercises.name%TYPE,
         description      exercises.description%TYPE,
         group_id         exercises.group_id%TYPE,
         muscle_group_name muscle_groups.group_name%TYPE
     );
    TYPE ty_exercise_in_plan_table IS TABLE OF ty_exercise_in_plan_record INDEX BY PLS_INTEGER;

    PROCEDURE CreateTrainingPlan (
        p_name    IN training_plans.name%TYPE,
        p_plan_id OUT training_plans.plan_id%TYPE
    );

    PROCEDURE DeleteTrainingPlan (
        p_plan_id IN training_plans.plan_id%TYPE
    );

    PROCEDURE UpdateTrainingPlan (
        p_plan_id IN training_plans.plan_id%TYPE,
        p_name    IN training_plans.name%TYPE
    );

    FUNCTION GetTrainingPlanById (
        p_plan_id IN training_plans.plan_id%TYPE
    ) RETURN ty_training_plan_record;

    FUNCTION ListAllTrainingPlans
        RETURN ty_training_plan_table;

    PROCEDURE AddExerciseToPlan (
        p_plan_id     IN training_exercise.plan_id%TYPE,
        p_exercise_id IN training_exercise.exercise_id%TYPE
    );

    PROCEDURE RemoveExerciseFromPlan (
        p_plan_id     IN training_exercise.plan_id%TYPE,
        p_exercise_id IN training_exercise.exercise_id%TYPE
    );

    PROCEDURE RemoveAllExercisesFromPlan (
        p_plan_id IN training_exercise.plan_id%TYPE
    );

    FUNCTION GetExercisesForPlan (
        p_plan_id IN training_exercise.plan_id%TYPE
    ) RETURN ty_exercise_in_plan_table;

    FUNCTION GetPlansForExercise (
        p_exercise_id IN training_exercise.exercise_id%TYPE
    ) RETURN ty_training_plan_table;

END PKG_TRAINING_PLAN_MGMT;
/

CREATE OR REPLACE PACKAGE BODY PKG_TRAINING_PLAN_MGMT AS

    FUNCTION fn_validate_plan_exercise(
        p_plan_id     IN NUMBER,
        p_exercise_id IN NUMBER,
        p_check_plan_exists BOOLEAN DEFAULT TRUE,
        p_check_exercise_exists BOOLEAN DEFAULT TRUE
    ) RETURN BOOLEAN IS
        v_count NUMBER;
    BEGIN
        IF p_check_plan_exists THEN
            SELECT COUNT(*) INTO v_count FROM training_plans WHERE plan_id = p_plan_id;
            IF v_count = 0 THEN
                RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || p_plan_id || ' nie istnieje.');
            END IF;
        END IF;

        IF p_check_exercise_exists THEN
            SELECT COUNT(*) INTO v_count FROM exercises WHERE exercise_id = p_exercise_id;
            IF v_count = 0 THEN
                RAISE_APPLICATION_ERROR(-20011, 'Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
            END IF;
        END IF;
        RETURN TRUE;
    END fn_validate_plan_exercise;

    PROCEDURE CreateTrainingPlan (
        p_name    IN training_plans.name%TYPE,
        p_plan_id OUT training_plans.plan_id%TYPE
    ) AS
    BEGIN
        IF TRIM(p_name) IS NULL THEN
            RAISE_APPLICATION_ERROR(-20301, 'Nazwa planu treningowego nie może być pusta.');
        END IF;

        INSERT INTO training_plans (plan_id, name)
        VALUES (training_plans_seq.NEXTVAL, TRIM(p_name))
        RETURNING plan_id INTO p_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_plan_id := NULL;
            RAISE;
    END CreateTrainingPlan;

    PROCEDURE DeleteTrainingPlan (
        p_plan_id IN training_plans.plan_id%TYPE
    ) AS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM training_plans WHERE plan_id = p_plan_id;
        IF v_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || p_plan_id || ' nie istnieje.');
        END IF;

        DELETE FROM training_exercise WHERE plan_id = p_plan_id;
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' rekordów usuniętych z training_exercise dla plan_id: ' || p_plan_id);

        DELETE FROM personal_plans WHERE plan_id = p_plan_id;
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' rekordów usuniętych z personal_plan dla plan_id: ' || p_plan_id);

        DELETE FROM training_plans WHERE plan_id = p_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END DeleteTrainingPlan;

    PROCEDURE UpdateTrainingPlan (
        p_plan_id IN training_plans.plan_id%TYPE,
        p_name    IN training_plans.name%TYPE
    ) AS
    BEGIN
        IF TRIM(p_name) IS NULL THEN
            RAISE_APPLICATION_ERROR(-20301, 'Nazwa planu treningowego nie może być pusta.');
        END IF;

        UPDATE training_plans
        SET name = TRIM(p_name)
        WHERE plan_id = p_plan_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || p_plan_id || ' nie istnieje.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END UpdateTrainingPlan;

    FUNCTION GetTrainingPlanById (
        p_plan_id IN training_plans.plan_id%TYPE
    ) RETURN ty_training_plan_record AS
        v_plan_rec ty_training_plan_record;
    BEGIN
        SELECT plan_id, name
        INTO v_plan_rec
        FROM training_plans
        WHERE plan_id = p_plan_id;
        RETURN v_plan_rec;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || p_plan_id || ' nie istnieje.');
        WHEN OTHERS THEN
            RAISE;
    END GetTrainingPlanById;

    FUNCTION ListAllTrainingPlans
        RETURN ty_training_plan_table AS
        v_plans_tbl ty_training_plan_table;
    BEGIN
        SELECT plan_id, name
            BULK COLLECT INTO v_plans_tbl
        FROM training_plans
        ORDER BY name;
        RETURN v_plans_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END ListAllTrainingPlans;

    PROCEDURE AddExerciseToPlan (
        p_plan_id     IN training_exercise.plan_id%TYPE,
        p_exercise_id IN training_exercise.exercise_id%TYPE
    ) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, p_exercise_id);

        INSERT INTO training_exercise (plan_id, exercise_id)
        VALUES (p_plan_id, p_exercise_id);
        COMMIT;
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            DBMS_OUTPUT.PUT_LINE('Ćwiczenie ID ' || p_exercise_id || ' jest już w planie ID ' || p_plan_id || '.');
            ROLLBACK;
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END AddExerciseToPlan;

    PROCEDURE RemoveExerciseFromPlan (
        p_plan_id     IN training_exercise.plan_id%TYPE,
        p_exercise_id IN training_exercise.exercise_id%TYPE
    ) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, p_exercise_id);

        DELETE FROM training_exercise
        WHERE plan_id = p_plan_id AND exercise_id = p_exercise_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20302, 'Nie znaleziono ćwiczenia ID '|| p_exercise_id ||' w planie ID '|| p_plan_id ||' do usunięcia.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END RemoveExerciseFromPlan;

    PROCEDURE RemoveAllExercisesFromPlan (
        p_plan_id IN training_exercise.plan_id%TYPE
    ) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, NULL, p_check_exercise_exists => FALSE);

        DELETE FROM training_exercise
        WHERE plan_id = p_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END RemoveAllExercisesFromPlan;

    FUNCTION GetExercisesForPlan (
        p_plan_id IN training_exercise.plan_id%TYPE
    ) RETURN ty_exercise_in_plan_table AS
        v_exercises_tbl ty_exercise_in_plan_table;
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, NULL, p_check_exercise_exists => FALSE);

        SELECT e.exercise_id, e.name, e.description, e.group_id, mg.group_name
            BULK COLLECT INTO v_exercises_tbl
        FROM training_exercise te
                 JOIN exercises e ON te.exercise_id = e.exercise_id
                 JOIN muscle_groups mg ON e.group_id = mg.group_id
        WHERE te.plan_id = p_plan_id
        ORDER BY e.name;
        RETURN v_exercises_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetExercisesForPlan;

    FUNCTION GetPlansForExercise (
        p_exercise_id IN training_exercise.exercise_id%TYPE
    ) RETURN ty_training_plan_table AS
        v_plans_tbl ty_training_plan_table;
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(NULL, p_exercise_id, p_check_plan_exists => FALSE);

        SELECT tp.plan_id, tp.name
            BULK COLLECT INTO v_plans_tbl
        FROM training_exercise te
                 JOIN training_plans tp ON te.plan_id = tp.plan_id
        WHERE te.exercise_id = p_exercise_id
        ORDER BY tp.name;
        RETURN v_plans_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetPlansForExercise;

END PKG_TRAINING_PLAN_MGMT;
/