CREATE OR REPLACE PROCEDURE prc_find_trainers_by_specialization(
    p_specialization IN VARCHAR2,
    p_trainers OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_trainers FOR
        SELECT t.trainer_id, t.name, t.surname, t.specialization, t.contact
        FROM TRAINERS t
        WHERE UPPER(t.specialization) LIKE '%' || UPPER(p_specialization) || '%'
        ORDER BY t.surname, t.name;

    DBMS_OUTPUT.PUT_LINE('Wyszukiwanie trenerów o specjalizacji: ' || p_specialization);
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Błąd podczas wyszukiwania trenerów: ' || SQLERRM);
        RAISE;
END prc_find_trainers_by_specialization;
/