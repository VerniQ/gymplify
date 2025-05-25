CREATE OR REPLACE PROCEDURE prc_get_all_users(
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
        DBMS_OUTPUT.PUT_LINE('Error in prc_get_all_users: ' || SQLERRM);
        RAISE;
END prc_get_all_users;
/