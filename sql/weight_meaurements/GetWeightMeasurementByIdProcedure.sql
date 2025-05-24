CREATE OR REPLACE PROCEDURE prc_GetWeightMeasurementById (
    p_measurement_id IN weight_measurements.measurement_id%TYPE,
    p_record_cursor  OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_record_cursor FOR
        SELECT measurement_id, user_id, measurement_date, weight
        FROM weight_measurements
        WHERE measurement_id = p_measurement_id;
END prc_GetWeightMeasurementById;
/