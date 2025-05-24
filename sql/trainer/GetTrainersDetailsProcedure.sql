CREATE OR REPLACE PROCEDURE prc_get_trainer_details(
    p_trainer_id IN NUMBER,
    p_trainer_data OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_count
    FROM TRAINERS
    WHERE trainer_id = p_trainer_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' nie istnieje.');
        RETURN;
    END IF;

    OPEN p_trainer_data FOR
        SELECT t.trainer_id, t.user_id, t.name, t.surname, t.specialization, t.contact,
               u.username, u.email
        FROM TRAINERS t
                 JOIN USERS u ON t.user_id = u.user_id
        WHERE t.trainer_id = p_trainer_id;

    p_success := TRUE;

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania danych trenera: ' || SQLERRM);
END prc_get_trainer_details;
/