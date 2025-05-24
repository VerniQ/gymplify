CREATE OR REPLACE PROCEDURE prc_get_trainer_sessions(
    p_trainer_id IN NUMBER,
    p_from_date IN DATE DEFAULT SYSDATE-30,
    p_to_date IN DATE DEFAULT SYSDATE+30,
    p_sessions OUT SYS_REFCURSOR,
    p_success OUT BOOLEAN
) AS
    v_count NUMBER;
BEGIN
    p_success := FALSE;

    -- Sprawdź czy trener istnieje
    SELECT COUNT(*)
    INTO v_count
    FROM trainers
    WHERE trainer_id = p_trainer_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Trener z ID ' || p_trainer_id || ' nie istnieje.');
        RETURN;
    END IF;

    -- Pobierz sesje trenera w danym okresie
    OPEN p_sessions FOR
        SELECT schedule_id, trainer_id, session_date,
               start_time, end_time
        FROM trainer_sessions
        WHERE trainer_id = p_trainer_id
          AND session_date BETWEEN p_from_date AND p_to_date
        ORDER BY session_date, start_time;

    p_success := TRUE;

EXCEPTION
    WHEN OTHERS THEN
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas pobierania sesji trenera: ' || SQLERRM);
END prc_get_trainer_sessions;
/