CREATE OR REPLACE PROCEDURE prc_get_all_trainers(
    p_trainers OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
BEGIN
    p_success := FALSE;

    OPEN p_trainers FOR
        SELECT t.trainer_id,
               t.user_id,
               t.name,
               t.surname,
               t.specialization,
               t.contact,
               u.username,
               u.email
        FROM TRAINERS t
                 JOIN USERS u ON t.user_id = u.user_id
        ORDER BY t.surname, t.name;

    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Lista trenerów została pobrana.');

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania listy trenerów: ' || SQLERRM);
        RAISE; 
END prc_get_all_trainers;
/