CREATE SEQUENCE trainer_sessions_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE CreateTrainerSession (
    p_trainer_id  IN trainer_sessions.trainer_id%TYPE,
    p_session_date IN trainer_sessions.session_date%TYPE,
    p_start_time  IN trainer_sessions.start_time%TYPE,
    p_end_time    IN trainer_sessions.end_time%TYPE,
    p_schedule_id OUT trainer_sessions.schedule_id%TYPE
)
AS
BEGIN
    INSERT INTO trainer_sessions (schedule_id, trainer_id, session_date, start_time, end_time)
    VALUES (trainer_sessions_seq.NEXTVAL, p_trainer_id, p_session_date, p_start_time, p_end_time)
    RETURNING schedule_id INTO p_schedule_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CreateTrainerSession;
/