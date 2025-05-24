CREATE SEQUENCE weight_measurements_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE CreateWeightMeasurement (
    p_user_id           IN weight_measurements.user_id%TYPE,
    p_measurement_date  IN weight_measurements.measurement_date%TYPE,
    p_weight            IN weight_measurements.weight%TYPE,
    p_measurement_id    OUT weight_measurements.measurement_id%TYPE
)
AS
BEGIN
    INSERT INTO weight_measurements (measurement_id, user_id, measurement_date, weight)
    VALUES (weight_measurements_seq.NEXTVAL, p_user_id, p_measurement_date, p_weight)
    RETURNING measurement_id INTO p_measurement_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CreateWeightMeasurement;
/