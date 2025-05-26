CREATE OR REPLACE PACKAGE PKG_LEADERBOARD_MANAGEMENT AS

    TYPE ty_leaderboard_entry_record IS RECORD (
        result_id        weight_leaderboard.result_id%TYPE,
        user_id          weight_leaderboard.user_id%TYPE,
        username         users.username%TYPE,
        exercise_id      weight_leaderboard.exercise_id%TYPE,
        exercise_name    exercises.name%TYPE,
        measurement_date weight_leaderboard.measurement_date%TYPE,
        weight           weight_leaderboard.weight%TYPE
    );

    TYPE ty_leaderboard_entry_table IS TABLE OF ty_leaderboard_entry_record INDEX BY PLS_INTEGER;

    PROCEDURE CreateLeaderboardEntry (
        p_user_id           IN weight_leaderboard.user_id%TYPE,
        p_exercise_id       IN weight_leaderboard.exercise_id%TYPE,
        p_measurement_date  IN weight_leaderboard.measurement_date%TYPE,
        p_weight            IN weight_leaderboard.weight%TYPE,
        p_result_id         OUT weight_leaderboard.result_id%TYPE
    );

    PROCEDURE DeleteLeaderboardEntry (
        p_result_id IN weight_leaderboard.result_id%TYPE
    );

    PROCEDURE UpdateLeaderboardEntry (
        p_result_id         IN weight_leaderboard.result_id%TYPE,
        p_exercise_id       IN weight_leaderboard.exercise_id%TYPE,
        p_measurement_date  IN weight_leaderboard.measurement_date%TYPE,
        p_weight            IN weight_leaderboard.weight%TYPE
    );

    FUNCTION GetLeaderboardEntryById (
        p_result_id IN weight_leaderboard.result_id%TYPE
    ) RETURN ty_leaderboard_entry_record;

    FUNCTION GetLeaderboardByExercise (
        p_exercise_id IN weight_leaderboard.exercise_id%TYPE
    ) RETURN ty_leaderboard_entry_table;

    FUNCTION GetLeaderboardByUser (
        p_user_id IN weight_leaderboard.user_id%TYPE
    ) RETURN ty_leaderboard_entry_table;

    FUNCTION ListAllLeaderboardEntries
        RETURN ty_leaderboard_entry_table;

END PKG_LEADERBOARD_MANAGEMENT;
/

CREATE OR REPLACE PACKAGE BODY PKG_LEADERBOARD_MANAGEMENT AS

    FUNCTION fn_validate_user_exercise(
        p_user_id IN NUMBER,
        p_exercise_id IN NUMBER
    ) RETURN BOOLEAN IS
        v_user_count NUMBER;
        v_exercise_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_user_count FROM USERS WHERE user_id = p_user_id;
        IF v_user_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20005, 'Użytkownik o ID ' || p_user_id || ' nie istnieje.');
        END IF;

        SELECT COUNT(*) INTO v_exercise_count FROM EXERCISES WHERE exercise_id = p_exercise_id;
        IF v_exercise_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20011, 'Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
        END IF;
        RETURN TRUE;
    END fn_validate_user_exercise;


    PROCEDURE CreateLeaderboardEntry (
        p_user_id           IN weight_leaderboard.user_id%TYPE,
        p_exercise_id       IN weight_leaderboard.exercise_id%TYPE,
        p_measurement_date  IN weight_leaderboard.measurement_date%TYPE,
        p_weight            IN weight_leaderboard.weight%TYPE,
        p_result_id         OUT weight_leaderboard.result_id%TYPE
    ) AS
        v_is_valid BOOLEAN;
    BEGIN
        v_is_valid := fn_validate_user_exercise(p_user_id, p_exercise_id); -- Walidacja

        IF p_weight <= 0 THEN
            RAISE_APPLICATION_ERROR(-20200, 'Waga dla wpisu w leaderboardzie musi być dodatnia.');
        END IF;

        INSERT INTO weight_leaderboard (result_id, user_id, exercise_id, measurement_date, weight)
        VALUES (weight_leaderboard_seq.NEXTVAL, p_user_id, p_exercise_id, p_measurement_date, p_weight)
        RETURNING result_id INTO p_result_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_result_id := NULL;
            RAISE;
    END CreateLeaderboardEntry;

    PROCEDURE DeleteLeaderboardEntry (
        p_result_id IN weight_leaderboard.result_id%TYPE
    ) AS
    BEGIN
        DELETE FROM weight_leaderboard
        WHERE result_id = p_result_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20201, 'Wpis w leaderboardzie o ID ' || p_result_id || ' nie istnieje.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END DeleteLeaderboardEntry;

    PROCEDURE UpdateLeaderboardEntry (
        p_result_id         IN weight_leaderboard.result_id%TYPE,
        p_exercise_id       IN weight_leaderboard.exercise_id%TYPE,
        p_measurement_date  IN weight_leaderboard.measurement_date%TYPE,
        p_weight            IN weight_leaderboard.weight%TYPE
    ) AS
        v_user_id_original weight_leaderboard.user_id%TYPE;
        v_is_valid BOOLEAN;
    BEGIN
        BEGIN
            SELECT user_id INTO v_user_id_original
            FROM weight_leaderboard
            WHERE result_id = p_result_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20201, 'Wpis w leaderboardzie o ID ' || p_result_id || ' nie istnieje.');
        END;

        v_is_valid := fn_validate_user_exercise(v_user_id_original, p_exercise_id);

        IF p_weight <= 0 THEN
            RAISE_APPLICATION_ERROR(-20200, 'Waga dla wpisu w leaderboardzie musi być dodatnia.');
        END IF;

        UPDATE weight_leaderboard
        SET exercise_id = p_exercise_id,
            measurement_date = p_measurement_date,
            weight = p_weight
        WHERE result_id = p_result_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20201, 'Wpis w leaderboardzie o ID ' || p_result_id || ' nie istnieje (problem z UPDATE).');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END UpdateLeaderboardEntry;

    FUNCTION GetLeaderboardEntryById (
        p_result_id IN weight_leaderboard.result_id%TYPE
    ) RETURN ty_leaderboard_entry_record AS
        v_entry_rec ty_leaderboard_entry_record;
    BEGIN
        SELECT wl.result_id, wl.user_id, u.username, wl.exercise_id, e.name, wl.measurement_date, wl.weight
        INTO v_entry_rec
        FROM weight_leaderboard wl
                 JOIN users u ON wl.user_id = u.user_id
                 JOIN exercises e ON wl.exercise_id = e.exercise_id
        WHERE wl.result_id = p_result_id;
        RETURN v_entry_rec;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20201, 'Wpis w leaderboardzie o ID ' || p_result_id || ' nie istnieje.');
        WHEN OTHERS THEN
            RAISE;
    END GetLeaderboardEntryById;

    FUNCTION GetLeaderboardByExercise (
        p_exercise_id IN weight_leaderboard.exercise_id%TYPE
    ) RETURN ty_leaderboard_entry_table AS
        v_entries_tbl ty_leaderboard_entry_table;
        v_exercise_exists NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_exercise_exists FROM EXERCISES WHERE exercise_id = p_exercise_id;
        IF v_exercise_exists = 0 THEN
            RAISE_APPLICATION_ERROR(-20011, 'Ćwiczenie o ID ' || p_exercise_id || ' nie istnieje.');
        END IF;

        SELECT wl.result_id, wl.user_id, u.username, wl.exercise_id, e.name, wl.measurement_date, wl.weight
            BULK COLLECT INTO v_entries_tbl
        FROM weight_leaderboard wl
                 JOIN users u ON wl.user_id = u.user_id
                 JOIN exercises e ON wl.exercise_id = e.exercise_id
        WHERE wl.exercise_id = p_exercise_id
        ORDER BY wl.weight DESC, wl.measurement_date DESC;
        RETURN v_entries_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetLeaderboardByExercise;

    FUNCTION GetLeaderboardByUser (
        p_user_id IN weight_leaderboard.user_id%TYPE
    ) RETURN ty_leaderboard_entry_table AS
        v_entries_tbl ty_leaderboard_entry_table;
        v_user_exists NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_user_exists FROM USERS WHERE user_id = p_user_id;
        IF v_user_exists = 0 THEN
            RAISE_APPLICATION_ERROR(-20005, 'Użytkownik o ID ' || p_user_id || ' nie istnieje.');
        END IF;

        SELECT wl.result_id, wl.user_id, u.username, wl.exercise_id, e.name, wl.measurement_date, wl.weight
            BULK COLLECT INTO v_entries_tbl
        FROM weight_leaderboard wl
                 JOIN users u ON wl.user_id = u.user_id
                 JOIN exercises e ON wl.exercise_id = e.exercise_id
        WHERE wl.user_id = p_user_id
        ORDER BY e.name, wl.measurement_date DESC;
        RETURN v_entries_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetLeaderboardByUser;

    FUNCTION ListAllLeaderboardEntries
        RETURN ty_leaderboard_entry_table AS
        v_entries_tbl ty_leaderboard_entry_table;
    BEGIN
        SELECT wl.result_id, wl.user_id, u.username, wl.exercise_id, e.name, wl.measurement_date, wl.weight
            BULK COLLECT INTO v_entries_tbl
        FROM weight_leaderboard wl
                 JOIN users u ON wl.user_id = u.user_id
                 JOIN exercises e ON wl.exercise_id = e.exercise_id
        ORDER BY e.name, wl.weight DESC, wl.measurement_date DESC;
        RETURN v_entries_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END ListAllLeaderboardEntries;

END PKG_LEADERBOARD_MANAGEMENT;
/