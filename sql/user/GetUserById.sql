CREATE OR REPLACE PROCEDURE prc_get_user_by_id(
    p_user_id IN USERS.user_id%TYPE,
    p_user_cursor OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
BEGIN
    p_success := FALSE;
    OPEN p_user_cursor FOR
        SELECT user_id, username, email, role, password_hash, created_at
        FROM USERS
        WHERE user_id = p_user_id;
    p_success := TRUE;
EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Error in prc_get_user_by_id for user ID ' || p_user_id || ': ' || SQLERRM);
        RAISE;
END prc_get_user_by_id;
/