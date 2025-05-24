CREATE OR REPLACE PROCEDURE ListAllWeightMeasurements (
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT wm.measurement_id, wm.user_id, u.username, wm.measurement_date, wm.weight
        FROM weight_measurements wm
        JOIN users u ON wm.user_id = u.user_id
        ORDER BY u.username, wm.measurement_date DESC;
END ListAllWeightMeasurements;
/