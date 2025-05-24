CREATE OR REPLACE PROCEDURE DeleteTrainingPlan (
    p_plan_id     IN training_plans.plan_id%TYPE
)
AS
BEGIN
    -- Usuń powiązane rekordy z tabeli łączącej training_exercise
    DELETE FROM training_exercise WHERE plan_id = p_plan_id;

    -- Usuń powiązane rekordy z personal_plans (jeśli plan jest usunięty, nie powinien być przypisany)
    DELETE FROM personal_plans WHERE plan_id = p_plan_id;

    DELETE FROM training_plans
    WHERE plan_id = p_plan_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END DeleteTrainingPlan;
/