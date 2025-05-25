CREATE OR REPLACE PROCEDURE prc_update_user_role(
    p_user_id IN USERS.user_id%TYPE,
    p_new_role IN USERS.role%TYPE,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;
    SELECT COUNT(*) INTO v_count FROM USERS WHERE user_id = p_user_id;
    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('User with ID ' || p_user_id || ' does not exist.');
        RETURN;
    END IF;

    UPDATE USERS SET role = UPPER(p_new_role) WHERE user_id = p_user_id;
    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Role for user ID ' || p_user_id || ' updated to ' || UPPER(p_new_role));
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Error updating user role for user ID ' || p_user_id || ': ' || SQLERRM);
END prc_update_user_role;
/