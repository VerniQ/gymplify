CREATE OR REPLACE PROCEDURE prc_get_trainer_count(
    p_count OUT NUMBER
) AS
BEGIN
    SELECT COUNT(*)
    INTO p_count
    FROM TRAINERS;

    DBMS_OUTPUT.PUT_LINE('Liczba trenerów: ' || p_count);
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania liczby trenerów: ' || SQLERRM);
        p_count := 0;
END prc_get_trainer_count;
/