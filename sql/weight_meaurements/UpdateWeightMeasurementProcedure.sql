CREATE OR REPLACE PROCEDURE UpdateWeightMeasurement (
    p_measurement_id    IN weight_measurements.measurement_id%TYPE,
    p_measurement_date  IN weight_measurements.measurement_date%TYPE,
    p_weight            IN weight_measurements.weight%TYPE
)
AS
BEGIN
    UPDATE weight_measurements
    SET measurement_date = p_measurement_date,
        weight = p_weight
    WHERE measurement_id = p_measurement_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END UpdateWeightMeasurement;
/