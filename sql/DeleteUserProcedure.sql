CREATE OR REPLACE PROCEDURE prc_delete_user(
    p_user_id IN NUMBER,
    p_success OUT BOOLEAN
) AS
    v_count      NUMBER;
    v_trainer_id NUMBER;
BEGIN

    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_count
    FROM USERS
    WHERE user_id  = p_user_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('User with ID ' || p_user_id || ' does not exist.');
        RETURN;
    END IF;

    SAVEPOINT before_delete;

    BEGIN
        SELECT trainer_id
        INTO v_trainer_id
        FROM TRAINERS
        WHERE user_id = p_user_id;

        DELETE
        FROM TRAINER_SESSIONS
        WHERE trainer_id = v_trainer_id;

        DELETE
        FROM PERSONAL_PLANS
        WHERE trainer_id = v_trainer_id;

        DELETE
        FROM TRAINERS
        WHERE trainer_id = v_trainer_id;

        DBMS_OUTPUT.PUT_LINE('Deleted trainer information and related data.');
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('User is not a trainer.');
    END;

    DELETE
    FROM PERSONAL_PLANS
    WHERE user_id = p_user_id;

    DELETE
    FROM WEIGHT_MEASUREMENTS
    WHERE user_id = p_user_id;

    DELETE
    FROM WEIGHT_LEADERBOARD
    WHERE user_id = p_user_id;

    DELETE
    FROM USERS
    WHERE user_id = p_user_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('User with ID ' || p_user_id || ' successfully deleted.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK TO before_delete;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Error deleting user: ' || SQLERRM);
        DBMS_OUTPUT.PUT_LINE('Error details: ' || DBMS_UTILITY.FORMAT_ERROR_STACK);
END prc_delete_user;
/

DECLARE
    v_success BOOLEAN;
BEGIN
    prc_delete_user(1, v_success);

    IF v_success THEN
        DBMS_OUTPUT.PUT_LINE('User deletion completed successfully.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('User deletion failed.');
    END IF;
END;
/