CREATE OR REPLACE PROCEDURE prc_GetTrainerSessionsByTrainer (
    p_trainer_id IN trainer_sessions.trainer_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT
            ts.schedule_id,
            ts.trainer_id,
            t.name AS trainer_name,
            t.surname AS trainer_surname,
            ts.session_date,
            ts.start_time,
            ts.end_time
        FROM trainer_sessions ts
        JOIN trainers t ON ts.trainer_id = t.trainer_id
        WHERE ts.trainer_id = p_trainer_id
        ORDER BY ts.session_date DESC, ts.start_time DESC;
END prc_GetTrainerSessionsByTrainer;
/