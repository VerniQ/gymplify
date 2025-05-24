CREATE OR REPLACE PROCEDURE prc_GetTrainerSessionById (
    p_schedule_id IN trainer_sessions.schedule_id%TYPE,
    p_record_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_record_cursor FOR
        SELECT schedule_id, trainer_id, session_date, start_time, end_time -- Tutaj "date"
        FROM trainer_sessions
        WHERE schedule_id = p_schedule_id;
END prc_GetTrainerSessionById;
/