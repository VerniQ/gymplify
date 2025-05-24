CREATE OR REPLACE FUNCTION get_user_by_email(
    p_email IN VARCHAR2
) RETURN SYS_REFCURSOR
AS
    c_user SYS_REFCURSOR;
BEGIN
    OPEN c_user FOR
        SELECT * FROM USERS WHERE LOWER(email) = LOWER(p_email);
    RETURN c_user;
END get_user_by_email;
/