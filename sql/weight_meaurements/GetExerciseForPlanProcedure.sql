CREATE OR REPLACE PROCEDURE prc_get_exercise_for_plan (
    p_plan_id        IN training_exercise.plan_id%TYPE,
    p_records_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_records_cursor FOR
        SELECT
            e.exercise_id,
            e.name,
            e.description,
            e.group_id,
            mg.group_name AS muscle_group_name
        FROM
            training_exercise te
                JOIN exercises e ON te.exercise_id = e.exercise_id
                JOIN muscle_groups mg ON e.group_id = mg.group_id
        WHERE
            te.plan_id = p_plan_id
        ORDER BY
            e.name;
END prc_get_exercise_for_plan;
/