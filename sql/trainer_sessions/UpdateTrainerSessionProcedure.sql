CREATE OR REPLACE PROCEDURE prc_UpdateTrainerSession (
    p_schedule_id IN trainer_sessions.schedule_id%TYPE,
    p_trainer_id  IN trainer_sessions.trainer_id%TYPE,
    p_session_date IN trainer_sessions.session_date%TYPE,
    p_start_time  IN trainer_sessions.start_time%TYPE,
    p_end_time    IN trainer_sessions.end_time%TYPE
)
AS
BEGIN
    UPDATE trainer_sessions
    SET trainer_id = p_trainer_id,
        session_date = p_session_date,
        start_time = p_start_time,
        end_time = p_end_time
    WHERE schedule_id = p_schedule_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_UpdateTrainerSession;
/