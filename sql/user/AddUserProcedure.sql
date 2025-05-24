
CREATE SEQUENCE users_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;


CREATE OR REPLACE PROCEDURE add_user(
    p_username IN VARCHAR2,
    p_password_hash IN VARCHAR2,
    p_email IN VARCHAR2,
    p_role IN VARCHAR2
)
AS
BEGIN

    INSERT INTO USERS (user_id,
                       username,
                       password_hash,
                       email,
                       role,
                       created_at)
    VALUES (users_seq.NEXTVAL,
            p_username,
            p_password_hash,
            p_email,
            p_role,
            SYSTIMESTAMP);

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('User created successfully with ID: ' || users_seq.CURRVAL);
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error creating user: ' || SQLERRM);
        ROLLBACK;
END add_user;
/

