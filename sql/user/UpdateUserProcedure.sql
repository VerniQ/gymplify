CREATE OR REPLACE PROCEDURE update_user(
    p_user_id IN NUMBER,
    p_username IN VARCHAR2,
    p_email IN VARCHAR2
)
AS
BEGIN
    UPDATE USERS
    SET username = p_username,
        email = p_email
    WHERE user_id = p_user_id;
    COMMIT;
END update_user;
/