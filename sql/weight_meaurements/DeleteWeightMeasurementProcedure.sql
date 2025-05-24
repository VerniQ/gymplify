CREATE OR REPLACE PROCEDURE prc_DeleteWeightMeasurement (
    p_measurement_id IN weight_measurements.measurement_id%TYPE
)
AS
BEGIN
    DELETE FROM weight_measurements
    WHERE measurement_id = p_measurement_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END prc_DeleteWeightMeasurement;
/