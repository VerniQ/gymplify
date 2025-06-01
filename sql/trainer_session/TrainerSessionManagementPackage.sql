CREATE OR REPLACE PACKAGE PKG_TRAINER_SESSION_MGMT AS

    TYPE ty_trainer_session_record IS RECORD
                                      (
                                          schedule_id     trainer_sessions.schedule_id%TYPE,
                                          trainer_id      trainer_sessions.trainer_id%TYPE,
                                          trainer_name    trainers.name%TYPE,
                                          trainer_surname trainers.surname%TYPE,
                                          session_date    trainer_sessions.session_date%TYPE,
                                          start_time      trainer_sessions.start_time%TYPE,
                                          end_time        trainer_sessions.end_time%TYPE
                                      );
    TYPE ty_trainer_session_table IS TABLE OF ty_trainer_session_record INDEX BY PLS_INTEGER;

    PROCEDURE CreateTrainerSession(
        p_trainer_id IN trainer_sessions.trainer_id%TYPE,
        p_session_date IN trainer_sessions.session_date%TYPE,
        p_start_time IN trainer_sessions.start_time%TYPE,
        p_end_time IN trainer_sessions.end_time%TYPE,
        p_schedule_id OUT trainer_sessions.schedule_id%TYPE
    );

    PROCEDURE DeleteTrainerSession(
        p_schedule_id IN trainer_sessions.schedule_id%TYPE
    );

    PROCEDURE UpdateTrainerSession(
        p_schedule_id IN trainer_sessions.schedule_id%TYPE,
        p_trainer_id IN trainer_sessions.trainer_id%TYPE,
        p_session_date IN trainer_sessions.session_date%TYPE,
        p_start_time IN trainer_sessions.start_time%TYPE,
        p_end_time IN trainer_sessions.end_time%TYPE
    );

    FUNCTION GetTrainerSessionById(
        p_schedule_id IN trainer_sessions.schedule_id%TYPE
    ) RETURN ty_trainer_session_record;

    FUNCTION GetTrainerSessionsByTrainer(
        p_trainer_id IN trainer_sessions.trainer_id%TYPE,
        p_from_date IN DATE DEFAULT NULL,
        p_to_date IN DATE DEFAULT NULL
    ) RETURN ty_trainer_session_table;

    FUNCTION ListAllTrainerSessions(
        p_from_date IN DATE DEFAULT NULL,
        p_to_date IN DATE DEFAULT NULL
    ) RETURN ty_trainer_session_table;

END PKG_TRAINER_SESSION_MGMT;
/

CREATE OR REPLACE PACKAGE BODY PKG_TRAINER_SESSION_MGMT AS

    FUNCTION fn_validate_session_data(
        p_trainer_id IN NUMBER,
        p_start_time IN TIMESTAMP,
        p_end_time IN TIMESTAMP,
        p_schedule_id_to_exclude IN NUMBER DEFAULT NULL
    ) RETURN BOOLEAN IS
        v_count          NUMBER;
        v_conflict_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM TRAINERS WHERE trainer_id = p_trainer_id;
        IF v_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20400, 'Trener o ID ' || p_trainer_id || ' nie istnieje.');
        END IF;

        IF p_start_time >= p_end_time THEN
            RAISE_APPLICATION_ERROR(-20500, 'Czas rozpoczęcia sesji musi być wcześniejszy niż czas zakończenia.');
        END IF;

        SELECT COUNT(*)
        INTO v_conflict_count
        FROM trainer_sessions ts
        WHERE ts.trainer_id = p_trainer_id
          AND ts.schedule_id != NVL(p_schedule_id_to_exclude, -1)
          AND (
            (ts.start_time < p_end_time AND ts.end_time > p_start_time)
            );

        IF v_conflict_count > 0 THEN
            RAISE_APPLICATION_ERROR(-20501, 'Trener o ID ' || p_trainer_id ||
                                            ' ma już zaplanowaną sesję w tym przedziale czasowym.');
        END IF;

        RETURN TRUE;
    END fn_validate_session_data;

    PROCEDURE CreateTrainerSession(
        p_trainer_id IN trainer_sessions.trainer_id%TYPE,
        p_session_date IN trainer_sessions.session_date%TYPE,
        p_start_time IN trainer_sessions.start_time%TYPE,
        p_end_time IN trainer_sessions.end_time%TYPE,
        p_schedule_id OUT trainer_sessions.schedule_id%TYPE
    ) AS
        v_is_valid        BOOLEAN;
        v_full_start_time TIMESTAMP;
        v_full_end_time   TIMESTAMP;
    BEGIN
        v_full_start_time := TO_TIMESTAMP(TO_CHAR(p_session_date, 'YYYY-MM-DD') || TO_CHAR(p_start_time, ' HH24:MI:SS'),
                                          'YYYY-MM-DD HH24:MI:SS');
        v_full_end_time := TO_TIMESTAMP(TO_CHAR(p_session_date, 'YYYY-MM-DD') || TO_CHAR(p_end_time, ' HH24:MI:SS'),
                                        'YYYY-MM-DD HH24:MI:SS');

        v_is_valid := fn_validate_session_data(p_trainer_id, v_full_start_time, v_full_end_time);

        INSERT INTO trainer_sessions (schedule_id, trainer_id, session_date, start_time, end_time)
        VALUES (trainer_sessions_seq.NEXTVAL, p_trainer_id, TRUNC(v_full_start_time), v_full_start_time,
                v_full_end_time)
        RETURNING schedule_id INTO p_schedule_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_schedule_id := NULL;
            RAISE;
    END CreateTrainerSession;

    PROCEDURE DeleteTrainerSession(
        p_schedule_id IN trainer_sessions.schedule_id%TYPE
    ) AS
    BEGIN
        DELETE
        FROM trainer_sessions
        WHERE schedule_id = p_schedule_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20502, 'Sesja trenera o ID ' || p_schedule_id || ' nie istnieje.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END DeleteTrainerSession;

    PROCEDURE UpdateTrainerSession(
        p_schedule_id IN trainer_sessions.schedule_id%TYPE,
        p_trainer_id IN trainer_sessions.trainer_id%TYPE,
        p_session_date IN trainer_sessions.session_date%TYPE,
        p_start_time IN trainer_sessions.start_time%TYPE,
        p_end_time IN trainer_sessions.end_time%TYPE
    ) AS
        v_is_valid            BOOLEAN;
        v_full_start_time     TIMESTAMP;
        v_full_end_time       TIMESTAMP;
        v_original_trainer_id trainer_sessions.trainer_id%TYPE;
    BEGIN
        SELECT trainer_id INTO v_original_trainer_id FROM trainer_sessions WHERE schedule_id = p_schedule_id;

        v_full_start_time := TO_TIMESTAMP(TO_CHAR(p_session_date, 'YYYY-MM-DD') || TO_CHAR(p_start_time, ' HH24:MI:SS'),
                                          'YYYY-MM-DD HH24:MI:SS');
        v_full_end_time := TO_TIMESTAMP(TO_CHAR(p_session_date, 'YYYY-MM-DD') || TO_CHAR(p_end_time, ' HH24:MI:SS'),
                                        'YYYY-MM-DD HH24:MI:SS');

        IF p_trainer_id != v_original_trainer_id THEN
            v_is_valid := fn_validate_session_data(p_trainer_id, v_full_start_time, v_full_end_time, NULL);
        ELSE
            v_is_valid := fn_validate_session_data(p_trainer_id, v_full_start_time, v_full_end_time, p_schedule_id);
        END IF;


        UPDATE trainer_sessions
        SET trainer_id   = p_trainer_id,
            session_date = TRUNC(v_full_start_time),
            start_time   = v_full_start_time,
            end_time     = v_full_end_time
        WHERE schedule_id = p_schedule_id;
        COMMIT;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20502, 'Sesja trenera o ID ' || p_schedule_id || ' nie istnieje.');
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END UpdateTrainerSession;

    FUNCTION GetTrainerSessionById(
        p_schedule_id IN trainer_sessions.schedule_id%TYPE
    ) RETURN ty_trainer_session_record AS
        v_session_rec ty_trainer_session_record;
    BEGIN
        SELECT ts.schedule_id, ts.trainer_id, tr.name, tr.surname, ts.session_date, ts.start_time, ts.end_time
        INTO v_session_rec
        FROM trainer_sessions ts
                 JOIN trainers tr ON ts.trainer_id = tr.trainer_id
        WHERE ts.schedule_id = p_schedule_id;
        RETURN v_session_rec;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20502, 'Sesja trenera o ID ' || p_schedule_id || ' nie istnieje.');
        WHEN OTHERS THEN
            RAISE;
    END GetTrainerSessionById;

    FUNCTION GetTrainerSessionsByTrainer(
        p_trainer_id IN trainer_sessions.trainer_id%TYPE,
        p_from_date IN DATE DEFAULT NULL,
        p_to_date IN DATE DEFAULT NULL
    ) RETURN ty_trainer_session_table AS
        v_sessions_tbl   ty_trainer_session_table;
        v_trainer_exists NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_trainer_exists FROM TRAINERS WHERE trainer_id = p_trainer_id;
        IF v_trainer_exists = 0 THEN
            RAISE_APPLICATION_ERROR(-20400, 'Trener o ID ' || p_trainer_id || ' nie istnieje.');
        END IF;

        SELECT ts.schedule_id,
               ts.trainer_id,
               tr.name,
               tr.surname,
               ts.session_date,
               ts.start_time,
               ts.end_time
            BULK COLLECT
        INTO v_sessions_tbl
        FROM trainer_sessions ts
                 JOIN trainers tr ON ts.trainer_id = tr.trainer_id
        WHERE ts.trainer_id = p_trainer_id
          AND (p_from_date IS NULL OR ts.session_date >= TRUNC(p_from_date))
          AND (p_to_date IS NULL OR ts.session_date <= TRUNC(p_to_date))
        ORDER BY ts.session_date DESC, ts.start_time DESC;
        RETURN v_sessions_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetTrainerSessionsByTrainer;

    FUNCTION ListAllTrainerSessions(
        p_from_date IN DATE DEFAULT NULL,
        p_to_date IN DATE DEFAULT NULL
    ) RETURN ty_trainer_session_table AS
        v_sessions_tbl ty_trainer_session_table;
    BEGIN
        SELECT ts.schedule_id,
               ts.trainer_id,
               tr.name,
               tr.surname,
               ts.session_date,
               ts.start_time,
               ts.end_time
            BULK COLLECT
        INTO v_sessions_tbl
        FROM trainer_sessions ts
                 JOIN trainers tr ON ts.trainer_id = tr.trainer_id
        WHERE (p_from_date IS NULL OR ts.session_date >= TRUNC(p_from_date))
          AND (p_to_date IS NULL OR ts.session_date <= TRUNC(p_to_date))
        ORDER BY ts.session_date DESC, ts.start_time DESC;
        RETURN v_sessions_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END ListAllTrainerSessions;

END PKG_TRAINER_SESSION_MGMT;
/