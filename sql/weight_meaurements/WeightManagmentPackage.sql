CREATE OR REPLACE PACKAGE PKG_WEIGHT_MGMT AS

    TYPE ty_weight_measurement_record IS RECORD (
        measurement_id   weight_measurements.measurement_id%TYPE,
        user_id          weight_measurements.user_id%TYPE,
        username         users.username%TYPE,
        measurement_date weight_measurements.measurement_date%TYPE,
        weight           weight_measurements.weight%TYPE
    );

    TYPE ty_weight_measurement_table IS TABLE OF ty_weight_measurement_record INDEX BY PLS_INTEGER;

    PROCEDURE CreateWeightMeasurement (
        p_user_id           IN weight_measurements.user_id%TYPE,
        p_measurement_date  IN weight_measurements.measurement_date%TYPE,
        p_weight            IN weight_measurements.weight%TYPE,
        p_measurement_id    OUT weight_measurements.measurement_id%TYPE
    );

    PROCEDURE DeleteWeightMeasurement (
        p_measurement_id IN weight_measurements.measurement_id%TYPE
    );

    PROCEDURE UpdateWeightMeasurement (
        p_measurement_id    IN weight_measurements.measurement_id%TYPE,
        p_measurement_date  IN weight_measurements.measurement_date%TYPE,
        p_weight            IN weight_measurements.weight%TYPE
    );

    FUNCTION GetWeightMeasurementById (
        p_measurement_id IN weight_measurements.measurement_id%TYPE
    ) RETURN ty_weight_measurement_record;

    FUNCTION GetWeightMeasurementsByUser (
        p_user_id        IN weight_measurements.user_id%TYPE
    ) RETURN ty_weight_measurement_table;

    FUNCTION ListAllWeightMeasurements
        RETURN ty_weight_measurement_table;

END PKG_WEIGHT_MGMT;
/


CREATE OR REPLACE PACKAGE BODY PKG_WEIGHT_MGMT AS

    PROCEDURE CreateWeightMeasurement (
        p_user_id           IN weight_measurements.user_id%TYPE,
        p_measurement_date  IN weight_measurements.measurement_date%TYPE,
        p_weight            IN weight_measurements.weight%TYPE,
        p_measurement_id    OUT weight_measurements.measurement_id%TYPE
    ) AS
        v_user_exists NUMBER;
    BEGIN
        IF p_weight <= 0 THEN
            RAISE_APPLICATION_ERROR(-20103, 'Waga musi być wartością dodatnią.');
        END IF;

        SELECT COUNT(*) INTO v_user_exists FROM USERS u WHERE u.user_id = p_user_id;
        IF v_user_exists = 0 THEN
            RAISE_APPLICATION_ERROR(-20005, 'Użytkownik o ID ' || p_user_id || ' nie istnieje. Nie można dodać pomiaru.');
        END IF;

        INSERT INTO weight_measurements (measurement_id, user_id, measurement_date, weight)
        VALUES (WEIGHT_MEASUREMENTS_SEQ.NEXTVAL, p_user_id, p_measurement_date, p_weight)
        RETURNING measurement_id INTO p_measurement_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_measurement_id := NULL;
            RAISE;
    END CreateWeightMeasurement;

    PROCEDURE DeleteWeightMeasurement (
        p_measurement_id IN weight_measurements.measurement_id%TYPE
    ) AS
    BEGIN
        DELETE FROM weight_measurements
        WHERE measurement_id = p_measurement_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20100, 'Pomiar wagi o ID ' || p_measurement_id || ' nie istnieje lub został już usunięty.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END DeleteWeightMeasurement;

    PROCEDURE UpdateWeightMeasurement (
        p_measurement_id    IN weight_measurements.measurement_id%TYPE,
        p_measurement_date  IN weight_measurements.measurement_date%TYPE,
        p_weight            IN weight_measurements.weight%TYPE
    ) AS
    BEGIN
        IF p_weight <= 0 THEN
            RAISE_APPLICATION_ERROR(-20103, 'Waga musi być wartością dodatnią.');
        END IF;

        UPDATE weight_measurements
        SET measurement_date = p_measurement_date,
            weight = p_weight
        WHERE measurement_id = p_measurement_id;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20102, 'Pomiar wagi o ID ' || p_measurement_id || ' nie istnieje lub nie można go zaktualizować.');
        END IF;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END UpdateWeightMeasurement;

    FUNCTION GetWeightMeasurementById (
        p_measurement_id IN weight_measurements.measurement_id%TYPE
    ) RETURN ty_weight_measurement_record AS
        v_measurement_rec ty_weight_measurement_record;
    BEGIN
        SELECT
            wm.measurement_id,
            wm.user_id,
            u.username,
            wm.measurement_date,
            wm.weight
        INTO
            v_measurement_rec.measurement_id,
            v_measurement_rec.user_id,
            v_measurement_rec.username,
            v_measurement_rec.measurement_date,
            v_measurement_rec.weight
        FROM
            weight_measurements wm
                JOIN USERS u ON wm.user_id = u.user_id
        WHERE
            wm.measurement_id = p_measurement_id;

        RETURN v_measurement_rec;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20101, 'Pomiar wagi o ID ' || p_measurement_id || ' nie istnieje.');
        WHEN OTHERS THEN
            RAISE;
    END GetWeightMeasurementById;

    FUNCTION GetWeightMeasurementsByUser (
        p_user_id        IN weight_measurements.user_id%TYPE
    ) RETURN ty_weight_measurement_table AS
        v_measurements_tbl ty_weight_measurement_table;
        v_user_exists NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_user_exists FROM USERS u WHERE u.user_id = p_user_id;
        IF v_user_exists = 0 THEN
            RAISE_APPLICATION_ERROR(-20005, 'Użytkownik o ID ' || p_user_id || ' nie istnieje.');
        END IF;

        SELECT
            wm.measurement_id,
            wm.user_id,
            u.username,
            wm.measurement_date,
            wm.weight
            BULK COLLECT INTO v_measurements_tbl
        FROM
            weight_measurements wm
                JOIN USERS u ON wm.user_id = u.user_id
        WHERE
            wm.user_id = p_user_id
        ORDER BY
            wm.measurement_date DESC;

        RETURN v_measurements_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END GetWeightMeasurementsByUser;

    FUNCTION ListAllWeightMeasurements
        RETURN ty_weight_measurement_table AS
        v_measurements_tbl ty_weight_measurement_table;
    BEGIN
        SELECT
            wm.measurement_id,
            wm.user_id,
            u.username,
            wm.measurement_date,
            wm.weight
            BULK COLLECT INTO v_measurements_tbl
        FROM
            weight_measurements wm
                JOIN USERS u ON wm.user_id = u.user_id
        ORDER BY
            u.username, wm.measurement_date DESC;

        RETURN v_measurements_tbl;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END ListAllWeightMeasurements;

END PKG_WEIGHT_MGMT;
/