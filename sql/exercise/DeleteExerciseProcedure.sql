CREATE OR REPLACE PROCEDURE prc_delete_exercise(
    p_exercise_id IN NUMBER,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    SELECT COUNT(*)
    INTO v_count
    FROM exercises
    WHERE exercise_id = p_exercise_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
        RETURN;
    END IF;

    DELETE FROM training_exercise
    WHERE exercise_id = p_exercise_id;

    DELETE FROM weight_leaderboard
    WHERE exercise_id = p_exercise_id;

    DELETE FROM exercises
    WHERE exercise_id = p_exercise_id;

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' zostało usunięte.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas usuwania ćwiczenia: ' || SQLERRM);
END prc_delete_exercise;
/