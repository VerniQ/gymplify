CREATE OR REPLACE PROCEDURE prc_get_all_exercises(
    p_exercises OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
BEGIN
    p_success := FALSE;

    OPEN p_exercises FOR
        SELECT e.exercise_id, e.name, e.description, e.muscle_group,
               e.group_id, mg.group_name
        FROM EXERCISES e
                 LEFT JOIN MUSCLE_GROUPS mg ON e.group_id = mg.group_id
        ORDER BY e.name;

    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Lista ćwiczeń została pobrana.');

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania listy ćwiczeń: ' || SQLERRM);
END prc_get_all_exercises;
/