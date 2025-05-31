CREATE OR REPLACE PACKAGE PKG_PERSONAL_PLAN_MGMT AS

    TYPE ty_personal_plan_record IS RECORD
                                    (
                                        personal_plan_id personal_plans.personal_plan_id%TYPE,
                                        user_id          personal_plans.user_id%TYPE,
                                        username         users.username%TYPE,
                                        trainer_id       personal_plans.trainer_id%TYPE,
                                        trainer_name     trainers.name%TYPE,
                                        trainer_surname  trainers.surname%TYPE,
                                        plan_id          personal_plans.plan_id%TYPE,
                                        plan_name        training_plans.name%TYPE
                                    );
    TYPE ty_personal_plan_table IS TABLE OF ty_personal_plan_record INDEX BY PLS_INTEGER;

    TYPE ty_user_in_personal_plan_record IS RECORD
                                            (
                                                personal_plan_id personal_plans.personal_plan_id%TYPE,
                                                user_id          users.user_id%TYPE,
                                                username         users.username%TYPE,
                                                email            users.email%TYPE,
                                                trainer_id       trainers.trainer_id%TYPE,
                                                trainer_name     trainers.name%TYPE,
                                                trainer_surname  trainers.surname%TYPE
                                            );
    TYPE ty_user_in_personal_plan_table IS TABLE OF ty_user_in_personal_plan_record INDEX BY PLS_INTEGER;

    PROCEDURE AssignPlanToUser(
        p_trainer_id IN personal_plans.trainer_id%TYPE,
        p_user_id IN personal_plans.user_id%TYPE,
        p_plan_id IN personal_plans.plan_id%TYPE,
        p_personal_plan_id OUT personal_plans.personal_plan_id%TYPE
    );

    PROCEDURE UnassignPersonalPlanById(
        p_personal_plan_id IN personal_plans.personal_plan_id%TYPE
    );

    PROCEDURE UnassignPlanFromUser(
        p_user_id IN personal_plans.user_id%TYPE,
        p_plan_id IN personal_plans.plan_id%TYPE,
        p_trainer_id IN personal_plans.trainer_id%TYPE DEFAULT NULL
    );

    PROCEDURE UpdatePersonalPlanAssignment(
        p_personal_plan_id IN personal_plans.personal_plan_id%TYPE,
        p_new_trainer_id IN personal_plans.trainer_id%TYPE,
        p_new_plan_id IN personal_plans.plan_id%TYPE
    );

    FUNCTION GetPersonalPlanById(
        p_personal_plan_id IN personal_plans.personal_plan_id%TYPE
    ) RETURN ty_personal_plan_record;

    FUNCTION GetPersonalPlansForUser(
        p_user_id IN personal_plans.user_id%TYPE
    ) RETURN ty_personal_plan_table;

    FUNCTION GetUsersForPersonalPlanByPlanId(
        p_plan_id IN personal_plans.plan_id%TYPE
    ) RETURN ty_user_in_personal_plan_table;

    FUNCTION ListAllPersonalPlans
        RETURN ty_personal_plan_table;

END PKG_PERSONAL_PLAN_MGMT;
/
CREATE OR REPLACE PACKAGE BODY PKG_PERSONAL_PLAN_MGMT AS

    FUNCTION fn_validate_entities(
        p_user_id IN NUMBER,
        p_trainer_id IN NUMBER,
        p_plan_id IN NUMBER,
        p_check_user_role BOOLEAN DEFAULT FALSE,
        p_enforce_single_trainer BOOLEAN DEFAULT FALSE
    ) RETURN BOOLEAN IS
        v_count NUMBER;
        v_user_role users.role%TYPE;
        v_existing_trainer_id personal_plans.trainer_id%TYPE;
    BEGIN
        IF p_user_id IS NOT NULL THEN
            SELECT COUNT(*), MAX(role)
            INTO v_count, v_user_role
            FROM USERS
            WHERE user_id = p_user_id;

            IF v_count = 0 THEN
                RAISE_APPLICATION_ERROR(-20005, 'Użytkownik o ID ' || p_user_id || ' nie istnieje.');
            END IF;

            IF p_check_user_role THEN
                IF v_user_role != 'USER' THEN
                    RAISE_APPLICATION_ERROR(-20007, 'Użytkownik o ID ' || p_user_id || ' ma nieprawidłową rolę (' || v_user_role || ') i nie może mieć przypisanego planu osobistego.');
                END IF;
            END IF;
        END IF;

        IF p_trainer_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_count FROM TRAINERS WHERE trainer_id = p_trainer_id;
            IF v_count = 0 THEN
                RAISE_APPLICATION_ERROR(-20400, 'Trener o ID ' || p_trainer_id || ' nie istnieje.');
            END IF;
        END IF;

        IF p_plan_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_count FROM TRAINING_PLANS WHERE plan_id = p_plan_id;
            IF v_count = 0 THEN
                RAISE_APPLICATION_ERROR(-20300, 'Plan treningowy o ID ' || p_plan_id || ' nie istnieje.');
            END IF;
        END IF;

        IF p_user_id IS NOT NULL AND p_trainer_id IS NOT NULL AND p_enforce_single_trainer THEN
            SELECT COUNT(DISTINCT pp.trainer_id), MAX(pp.trainer_id)
            INTO v_count, v_existing_trainer_id
            FROM personal_plans pp
            WHERE pp.user_id = p_user_id
              AND pp.trainer_id IS NOT NULL
              AND pp.trainer_id != p_trainer_id;

            IF v_count > 0 THEN
                RAISE_APPLICATION_ERROR(-20010, 'Użytkownik ID ' || p_user_id ||
                                                ' ma już przypisany plan od innego trenera (ID ' || v_existing_trainer_id ||
                                                '). Nie można przypisać planu od trenera ID ' || p_trainer_id || '.');
            END IF;
        END IF;
        RETURN TRUE;
    END fn_validate_entities;

    PROCEDURE AssignPlanToUser(
        p_trainer_id IN personal_plans.trainer_id%TYPE,
        p_user_id IN personal_plans.user_id%TYPE,
        p_plan_id IN personal_plans.plan_id%TYPE,
        p_personal_plan_id OUT personal_plans.personal_plan_id%TYPE
    ) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_entities(
                p_user_id    => p_user_id,
                p_trainer_id => p_trainer_id,
                p_plan_id    => p_plan_id,
                p_check_user_role => TRUE,
                p_enforce_single_trainer => TRUE
                      );

        INSERT INTO personal_plans (personal_plan_id, trainer_id, user_id, plan_id)
        VALUES (personal_plans_seq.NEXTVAL, p_trainer_id, p_user_id, p_plan_id)
        RETURNING personal_plan_id INTO p_personal_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_personal_plan_id := NULL;
            RAISE;
    END AssignPlanToUser;

    PROCEDURE UnassignPersonalPlanById(
        p_personal_plan_id IN personal_plans.personal_plan_id%TYPE
    ) AS
    BEGIN
        DELETE
        FROM personal_plans
        WHERE personal_plan_id = p_personal_plan_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20401, 'Personalny plan o ID ' || p_personal_plan_id || ' nie istnieje.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END UnassignPersonalPlanById;

    PROCEDURE UnassignPlanFromUser(
        p_user_id IN personal_plans.user_id%TYPE,
        p_plan_id IN personal_plans.plan_id%TYPE,
        p_trainer_id IN personal_plans.trainer_id%TYPE DEFAULT NULL
    ) AS
        v_rows_deleted NUMBER;
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_entities(p_user_id, p_trainer_id, p_plan_id, FALSE, FALSE);

        DELETE
        FROM personal_plans
        WHERE user_id = p_user_id
          AND plan_id = p_plan_id
          AND (p_trainer_id IS NULL OR trainer_id = p_trainer_id);

        v_rows_deleted := SQL%ROWCOUNT;
        IF v_rows_deleted = 0 THEN
            RAISE_APPLICATION_ERROR(-20402, 'Nie znaleziono przypisania planu ID ' || p_plan_id ||
                                            ' dla użytkownika ID ' || p_user_id ||
                                            CASE
                                                WHEN p_trainer_id IS NOT NULL THEN ' przez trenera ID ' || p_trainer_id
                                                ELSE '' END ||
                                            ' do usunięcia.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END UnassignPlanFromUser;

    PROCEDURE UpdatePersonalPlanAssignment(
        p_personal_plan_id IN personal_plans.personal_plan_id%TYPE,
        p_new_trainer_id IN personal_plans.trainer_id%TYPE,
        p_new_plan_id IN personal_plans.plan_id%TYPE
    ) AS
        v_user_id_original personal_plans.user_id%TYPE;
        v_is_valid         BOOLEAN;
    BEGIN
        BEGIN
            SELECT user_id
            INTO v_user_id_original
            FROM personal_plans
            WHERE personal_plan_id = p_personal_plan_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20401, 'Personalny plan o ID ' || p_personal_plan_id || ' nie istnieje.');
        END;

        v_is_valid := fn_validate_entities(
                p_user_id    => v_user_id_original,
                p_trainer_id => p_new_trainer_id,
                p_plan_id    => p_new_plan_id,
                p_check_user_role => FALSE,
                p_enforce_single_trainer => TRUE
                      );

        UPDATE personal_plans
        SET trainer_id = p_new_trainer_id,
            plan_id    = p_new_plan_id
        WHERE personal_plan_id = p_personal_plan_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END UpdatePersonalPlanAssignment;

    FUNCTION GetPersonalPlanById(
        p_personal_plan_id IN personal_plans.personal_plan_id%TYPE
    ) RETURN ty_personal_plan_record AS
        v_plan_rec ty_personal_plan_record;
    BEGIN
        SELECT pp.personal_plan_id,
               pp.user_id,
               u.username,
               pp.trainer_id,
               t.name,
               t.surname,
               pp.plan_id,
               tp.name
        INTO
            v_plan_rec.personal_plan_id, v_plan_rec.user_id, v_plan_rec.username,
            v_plan_rec.trainer_id, v_plan_rec.trainer_name, v_plan_rec.trainer_surname,
            v_plan_rec.plan_id, v_plan_rec.plan_name
        FROM personal_plans pp
                 JOIN users u ON pp.user_id = u.user_id
                 JOIN trainers t ON pp.trainer_id = t.trainer_id
                 JOIN training_plans tp ON pp.plan_id = tp.plan_id
        WHERE pp.personal_plan_id = p_personal_plan_id;
        RETURN v_plan_rec;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20401, 'Personalny plan o ID ' || p_personal_plan_id || ' nie istnieje.');
        WHEN OTHERS THEN
            RAISE;
    END GetPersonalPlanById;

    FUNCTION GetPersonalPlansForUser(
        p_user_id IN personal_plans.user_id%TYPE
    ) RETURN ty_personal_plan_table AS
        v_plans_tbl ty_personal_plan_table;
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_entities(p_user_id, NULL, NULL, FALSE, FALSE);

        SELECT pp.personal_plan_id,
               pp.user_id,
               u.username,
               pp.trainer_id,
               t.name,
               t.surname,
               pp.plan_id,
               tp.name
            BULK COLLECT
        INTO v_plans_tbl
        FROM personal_plans pp
                 JOIN users u ON pp.user_id = u.user_id
                 JOIN trainers t ON pp.trainer_id = t.trainer_id
                 JOIN training_plans tp ON pp.plan_id = tp.plan_id
        WHERE pp.user_id = p_user_id
        ORDER BY tp.name;
        RETURN v_plans_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetPersonalPlansForUser;

    FUNCTION GetUsersForPersonalPlanByPlanId(
        p_plan_id IN personal_plans.plan_id%TYPE
    ) RETURN ty_user_in_personal_plan_table AS
        v_users_tbl ty_user_in_personal_plan_table;
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_entities(NULL, NULL, p_plan_id, FALSE, FALSE);

        SELECT pp.personal_plan_id,
               pp.user_id,
               u.username,
               u.email,
               pp.trainer_id,
               t.name,
               t.surname
            BULK COLLECT
        INTO v_users_tbl
        FROM personal_plans pp
                 JOIN users u ON pp.user_id = u.user_id
                 JOIN trainers t ON pp.trainer_id = t.trainer_id
        WHERE pp.plan_id = p_plan_id
        ORDER BY u.username;
        RETURN v_users_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetUsersForPersonalPlanByPlanId;

    FUNCTION ListAllPersonalPlans
        RETURN ty_personal_plan_table AS
        v_plans_tbl ty_personal_plan_table;
    BEGIN
        SELECT pp.personal_plan_id,
               pp.user_id,
               u.username,
               pp.trainer_id,
               t.name,
               t.surname,
               pp.plan_id,
               tp.name
            BULK COLLECT
        INTO v_plans_tbl
        FROM personal_plans pp
                 JOIN users u ON pp.user_id = u.user_id
                 JOIN trainers t ON pp.trainer_id = t.trainer_id
                 JOIN training_plans tp ON pp.plan_id = tp.plan_id
        ORDER BY u.username, tp.name;
        RETURN v_plans_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END ListAllPersonalPlans;

END PKG_PERSONAL_PLAN_MGMT;
/