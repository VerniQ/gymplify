CREATE OR REPLACE PROCEDURE prc_GetWeightMeasurementsByUser (
    p_user_id        IN weight_measurements.user_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT wm.measurement_id, wm.user_id, u.username, wm.measurement_date, wm.weight
        FROM weight_measurements wm
        JOIN users u ON wm.user_id = u.user_id
        WHERE wm.user_id = p_user_id
        ORDER BY wm.measurement_date DESC;
END prc_GetWeightMeasurementsByUser;
/