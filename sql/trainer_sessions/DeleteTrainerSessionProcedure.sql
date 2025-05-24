CREATE OR REPLACE PROCEDURE prc_DeleteTrainerSession (
    p_schedule_id IN trainer_sessions.schedule_id%TYPE
)
AS
BEGIN
    DELETE FROM trainer_sessions
    WHERE schedule_id = p_schedule_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_DeleteTrainerSession;
/