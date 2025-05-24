CREATE SEQUENCE trainers_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE prc_create_trainer(
    p_user_id IN NUMBER,
    p_name IN VARCHAR2,
    p_surname IN VARCHAR2,
    p_specialization IN VARCHAR2,
    p_contact IN VARCHAR2,
    p_trainer_id OUT NUMBER,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_count
    FROM USERS
    WHERE user_id = p_user_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' nie istnieje.');
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO v_count
    FROM TRAINERS
    WHERE user_id = p_user_id;

    IF v_count > 0 THEN
        DBMS_OUTPUT.PUT_LINE('Użytkownik z ID ' || p_user_id || ' jest już trenerem.');
        RETURN;
    END IF;

    INSERT INTO TRAINERS (trainer_id, user_id, name, surname, specialization, contact)
    VALUES (trainers_seq.NEXTVAL, p_user_id, p_name, p_surname, p_specialization, p_contact)
    RETURNING trainer_id INTO p_trainer_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Trener został pomyślnie dodany z ID: ' || p_trainer_id);

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas dodawania trenera: ' || SQLERRM);
END prc_create_trainer;
/