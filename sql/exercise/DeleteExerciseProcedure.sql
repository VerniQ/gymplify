CREATE OR REPLACE PROCEDURE prc_delete_exercise(
    p_exercise_id IN NUMBER,
    p_success OUT NUMBER
) AS
    v_count NUMBER;
BEGIN
    p_success := 0;

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
    DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' wierszy usuniętych z training_exercise dla exercise_id: ' || p_exercise_id);

    DELETE FROM weight_leaderboard
    WHERE exercise_id = p_exercise_id;
    DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' wierszy usuniętych z weight_leaderboard dla exercise_id: ' || p_exercise_id);

    DELETE FROM exercises
    WHERE exercise_id = p_exercise_id;
    DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' wierszy usuniętych z exercises dla exercise_id: ' || p_exercise_id);

    IF SQL%ROWCOUNT = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Nie udało się usunąć ćwiczenia o ID ' || p_exercise_id || ' z tabeli exercises (mogło zostać usunięte w międzyczasie).');
        ROLLBACK;
        p_success := 0;
        RETURN;
    END IF;

    COMMIT;
    p_success := 1;
    DBMS_OUTPUT.PUT_LINE('Ćwiczenie o ID ' || p_exercise_id || ' zostało pomyślnie usunięte.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := 0;
        DBMS_OUTPUT.PUT_LINE('Błąd SQL podczas usuwania ćwiczenia ID ' || p_exercise_id || ': ' || SQLCODE || ' - ' || SQLERRM);
END prc_delete_exercise;
/