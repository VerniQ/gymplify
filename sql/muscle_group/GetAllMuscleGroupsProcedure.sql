CREATE OR REPLACE PROCEDURE prc_get_all_muscle_groups(
    p_muscle_groups OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
BEGIN
    p_success := FALSE;

    OPEN p_muscle_groups FOR
        SELECT group_id, group_name, description
        FROM MUSCLE_GROUPS
        ORDER BY group_name;

    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Lista grup mięśniowych została pobrana.');

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania listy grup mięśniowych: ' || SQLERRM);
END prc_get_all_muscle_groups;
/