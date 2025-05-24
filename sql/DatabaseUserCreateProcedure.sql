DECLARE
    v_user_exists NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_user_exists FROM dba_users WHERE username = 'GYMPLIFY';
    IF v_user_exists > 0 THEN
        EXECUTE IMMEDIATE 'DROP USER gymplify CASCADE';
        DBMS_OUTPUT.PUT_LINE('Użytkownik GYMPLIFY usunięty.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Użytkownik GYMPLIFY nie istniał, pominięto usuwanie.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Błąd podczas próby usunięcia użytkownika GYMPLIFY: ' || SQLERRM);
        RAISE;
END;
/


DECLARE
    v_user_exists NUMBER;
    v_password    VARCHAR2(100) := 'gymplify';
BEGIN
    SELECT COUNT(*)
    INTO v_user_exists
    FROM dba_users
    WHERE username = 'GYMPLIFY';

    IF v_user_exists = 0 THEN
        EXECUTE IMMEDIATE 'CREATE USER gymplify IDENTIFIED BY "' || v_password ||
                          '" DEFAULT TABLESPACE USERS TEMPORARY TABLESPACE TEMP';
        DBMS_OUTPUT.PUT_LINE('Użytkownik GYMPLIFY utworzony pomyślnie z hasłem: ' || v_password);
    ELSE
        DBMS_OUTPUT.PUT_LINE('Użytkownik GYMPLIFY już istnieje. Pomijanie tworzenia.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Błąd podczas tworzenia/modyfikacji użytkownika GYMPLIFY: ' || SQLERRM);
        RAISE;
END;
/


GRANT CREATE SESSION TO gymplify;

GRANT RESOURCE TO gymplify;

GRANT CREATE TABLE TO gymplify;


ALTER USER gymplify QUOTA UNLIMITED ON USERS;

GRANT EXECUTE ON SYS.DBMS_OUTPUT TO gymplify;
GRANT CREATE SEQUENCE TO gymplify;
GRANT CREATE VIEW TO gymplify;

GRANT CREATE TRIGGER TO gymplify;

GRANT CREATE PROCEDURE TO gymplify;

GRANT DBA TO gymplify;
