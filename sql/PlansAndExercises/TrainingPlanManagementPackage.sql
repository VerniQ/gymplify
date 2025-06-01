CREATE OR REPLACE PACKAGE PKG_TRAINING_PLAN_MGMT AS

    PROCEDURE CreateTrainingPlan(
        p_name IN training_plans.name%TYPE,
        p_plan_id OUT training_plans.plan_id%TYPE
    );

    PROCEDURE DeleteTrainingPlan(
        p_plan_id IN training_plans.plan_id%TYPE
    );

    PROCEDURE UpdateTrainingPlan(
        p_plan_id IN training_plans.plan_id%TYPE,
        p_name IN training_plans.name%TYPE
    );

    PROCEDURE ListAllTrainingPlans_Proc(
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE GetTrainingPlanById_Proc(
        p_plan_id IN training_plans.plan_id%TYPE,
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE GetExercisesForPlan_Proc(
        p_plan_id IN training_exercise.plan_id%TYPE,
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE AddExerciseToPlan(
        p_plan_id IN training_exercise.plan_id%TYPE,
        p_exercise_id IN training_exercise.exercise_id%TYPE
    );

    PROCEDURE RemoveExerciseFromPlan(
        p_plan_id IN training_exercise.plan_id%TYPE,
        p_exercise_id IN training_exercise.exercise_id%TYPE
    );

    PROCEDURE RemoveAllExercisesFromPlan(
        p_plan_id IN training_exercise.plan_id%TYPE
    );

    TYPE ty_training_plan_record IS RECORD (
                                               plan_id training_plans.plan_id%TYPE,
                                               name    training_plans.name%TYPE);
    TYPE ty_training_plan_table IS TABLE OF ty_training_plan_record INDEX BY PLS_INTEGER;
    FUNCTION GetPlansForExercise(p_exercise_id IN training_exercise.exercise_id%TYPE) RETURN ty_training_plan_table;

END PKG_TRAINING_PLAN_MGMT;
/
CREATE OR REPLACE PACKAGE BODY PKG_TRAINING_PLAN_MGMT AS

    FUNCTION fn_validate_plan_exercise(
        p_plan_id IN NUMBER,
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

    PROCEDURE CreateTrainingPlan(p_name IN training_plans.name%TYPE, p_plan_id OUT training_plans.plan_id%TYPE) AS
    BEGIN
        IF TRIM(p_name) IS NULL THEN
            RAISE_APPLICATION_ERROR(-20301, 'Nazwa planu treningowego nie może być pusta.');
        END IF;
        INSERT INTO training_plans (plan_id, name)
        VALUES (training_plans_seq.NEXTVAL, TRIM(p_name))
        RETURNING plan_id INTO p_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; p_plan_id := NULL; RAISE;
    END CreateTrainingPlan;

    PROCEDURE DeleteTrainingPlan(p_plan_id IN training_plans.plan_id%TYPE) AS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM training_plans WHERE plan_id = p_plan_id;
        IF v_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || p_plan_id || ' nie istnieje.');
        END IF;
        DELETE FROM training_exercise WHERE plan_id = p_plan_id;
        DELETE FROM personal_plans WHERE plan_id = p_plan_id;
        DELETE FROM training_plans WHERE plan_id = p_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END DeleteTrainingPlan;

    PROCEDURE UpdateTrainingPlan(p_plan_id IN training_plans.plan_id%TYPE, p_name IN training_plans.name%TYPE) AS
    BEGIN
        IF TRIM(p_name) IS NULL THEN
            RAISE_APPLICATION_ERROR(-20301, 'Nazwa planu treningowego nie może być pusta.');
        END IF;
        UPDATE training_plans SET name = TRIM(p_name) WHERE plan_id = p_plan_id;
        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || p_plan_id || ' nie istnieje.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END UpdateTrainingPlan;

    FUNCTION GetTrainingPlanById_Func_Internal(p_plan_id IN training_plans.plan_id%TYPE) RETURN SYS_REFCURSOR AS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR SELECT plan_id, name FROM training_plans WHERE plan_id = p_plan_id;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF; RAISE;
    END GetTrainingPlanById_Func_Internal;

    PROCEDURE GetTrainingPlanById_Proc(p_plan_id IN training_plans.plan_id%TYPE, p_cursor OUT SYS_REFCURSOR) AS
    BEGIN
        OPEN p_cursor FOR SELECT plan_id, name FROM training_plans WHERE plan_id = p_plan_id;
    END GetTrainingPlanById_Proc;

    FUNCTION ListAllTrainingPlans_Func_Internal RETURN SYS_REFCURSOR AS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR SELECT plan_id, name FROM training_plans ORDER BY name;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF; RAISE;
    END ListAllTrainingPlans_Func_Internal;

    PROCEDURE ListAllTrainingPlans_Proc(p_cursor OUT SYS_REFCURSOR) AS
    BEGIN
        OPEN p_cursor FOR SELECT plan_id, name FROM training_plans ORDER BY name;
    END ListAllTrainingPlans_Proc;

    PROCEDURE AddExerciseToPlan(p_plan_id IN training_exercise.plan_id%TYPE,
                                p_exercise_id IN training_exercise.exercise_id%TYPE) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, p_exercise_id);
        INSERT INTO training_exercise (plan_id, exercise_id) VALUES (p_plan_id, p_exercise_id);
        COMMIT;
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN ROLLBACK;
        RAISE_APPLICATION_ERROR(-20305,
                                'Ćwiczenie ID ' || p_exercise_id || ' jest już przypisane do planu ID ' || p_plan_id ||
                                '.');
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END AddExerciseToPlan;

    PROCEDURE RemoveExerciseFromPlan(p_plan_id IN training_exercise.plan_id%TYPE,
                                     p_exercise_id IN training_exercise.exercise_id%TYPE) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, p_exercise_id);
        DELETE FROM training_exercise WHERE plan_id = p_plan_id AND exercise_id = p_exercise_id;
        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20302,
                                    'Nie znaleziono ćwiczenia ID ' || p_exercise_id || ' w planie ID ' || p_plan_id ||
                                    ' do usunięcia.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END RemoveExerciseFromPlan;

    PROCEDURE RemoveAllExercisesFromPlan(p_plan_id IN training_exercise.plan_id%TYPE) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, NULL, p_check_exercise_exists => FALSE);
        DELETE FROM training_exercise WHERE plan_id = p_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END RemoveAllExercisesFromPlan;

    FUNCTION GetExercisesForPlan_Func_Internal(p_plan_id IN training_exercise.plan_id%TYPE) RETURN SYS_REFCURSOR AS
        v_cursor   SYS_REFCURSOR;
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(p_plan_id, NULL, p_check_exercise_exists => FALSE);
        OPEN v_cursor FOR SELECT e.exercise_id, e.name, e.description, e.group_id, mg.group_name AS MUSCLE_GROUP_NAME
                          FROM training_exercise te
                                   JOIN exercises e ON te.exercise_id = e.exercise_id
                                   JOIN muscle_groups mg ON e.group_id = mg.group_id
                          WHERE te.plan_id = p_plan_id
                          ORDER BY e.name;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF; RAISE;
    END GetExercisesForPlan_Func_Internal;

    PROCEDURE GetExercisesForPlan_Proc(p_plan_id IN training_exercise.plan_id%TYPE, p_cursor OUT SYS_REFCURSOR) AS
    BEGIN
        OPEN p_cursor FOR
            SELECT e.exercise_id, e.name, e.description, e.group_id, mg.group_name AS MUSCLE_GROUP_NAME
            FROM training_exercise te
                     JOIN exercises e ON te.exercise_id = e.exercise_id
                     JOIN muscle_groups mg ON e.group_id = mg.group_id
            WHERE te.plan_id = p_plan_id
            ORDER BY e.name;
    END GetExercisesForPlan_Proc;

    FUNCTION GetPlansForExercise(p_exercise_id IN training_exercise.exercise_id%TYPE) RETURN ty_training_plan_table AS
        v_plans_tbl ty_training_plan_table;
        v_is_valid  BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_plan_exercise(NULL, p_exercise_id, p_check_plan_exists => FALSE);
        SELECT tp.plan_id, tp.name BULK COLLECT
        INTO v_plans_tbl
        FROM training_exercise te
                 JOIN training_plans tp ON te.plan_id = tp.plan_id
        WHERE te.exercise_id = p_exercise_id
        ORDER BY tp.name;
        RETURN v_plans_tbl;
    EXCEPTION
        WHEN OTHERS THEN RAISE;
    END GetPlansForExercise;

    FUNCTION GetTrainingPlanById(p_plan_id IN training_plans.plan_id%TYPE) RETURN SYS_REFCURSOR IS
    BEGIN
        RETURN GetTrainingPlanById_Func_Internal(p_plan_id);
    END;
    FUNCTION ListAllTrainingPlans RETURN SYS_REFCURSOR IS
    BEGIN
        RETURN ListAllTrainingPlans_Func_Internal();
    END;
    FUNCTION GetExercisesForPlan(p_plan_id IN training_exercise.plan_id%TYPE) RETURN SYS_REFCURSOR IS
    BEGIN
        RETURN GetExercisesForPlan_Func_Internal(p_plan_id);
    END;

END PKG_TRAINING_PLAN_MGMT;
/