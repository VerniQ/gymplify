-- Specyfikacja Pakietu
CREATE OR REPLACE PACKAGE PKG_APP_STATISTICS AS

    -- TYPY ZŁOŻONE POZOSTAJĄ DLA WEWNĘTRZNEJ LOGIKI (JEŚLI POTRZEBNE)
    -- ALE FUNKCJE _Typed BĘDĄ ZWRACAĆ SYS_REFCURSOR DLA JAVY
    TYPE ty_role_stat_record IS RECORD (
                                           role_name USERS.ROLE%TYPE,
                                           user_count NUMBER
                                       );
    TYPE ty_role_stat_table IS TABLE OF ty_role_stat_record INDEX BY PLS_INTEGER;

    TYPE ty_specialization_stat_record IS RECORD (
                                                     specialization TRAINERS.SPECIALIZATION%TYPE,
                                                     trainer_count NUMBER
                                                 );
    TYPE ty_specialization_stat_table IS TABLE OF ty_specialization_stat_record INDEX BY PLS_INTEGER;

    TYPE ty_trainer_workload_record IS RECORD (
                                                  trainer_id TRAINERS.TRAINER_ID%TYPE,
                                                  trainer_full_name VARCHAR2(510),
                                                  specialization TRAINERS.SPECIALIZATION%TYPE,
                                                  assigned_clients_count NUMBER,
                                                  total_scheduled_sessions NUMBER,
                                                  sessions_next_7_days NUMBER
                                              );
    TYPE ty_trainer_workload_table IS TABLE OF ty_trainer_workload_record INDEX BY PLS_INTEGER;

    TYPE ty_exercise_popularity_record IS RECORD (
                                                     exercise_name EXERCISES.NAME%TYPE,
                                                     muscle_group MUSCLE_GROUPS.GROUP_NAME%TYPE,
                                                     count_value NUMBER
                                                 );
    TYPE ty_exercise_popularity_table IS TABLE OF ty_exercise_popularity_record INDEX BY PLS_INTEGER;

    -- I. User Statistics
    FUNCTION GetTotalUserCount RETURN NUMBER;

    FUNCTION GetUserCountByRole_Typed RETURN SYS_REFCURSOR; -- ZMIANA

    PROCEDURE GetNewUsersByPeriod (
        p_start_date IN DATE,
        p_end_date IN DATE,
        p_new_user_stats OUT SYS_REFCURSOR,
        p_success OUT NUMBER -- ZMIANA
    );

    -- GetUserAverageWeightChange zakomentowane jak poprzednio
/*
    PROCEDURE GetUserAverageWeightChange (
        p_user_id IN USERS.USER_ID%TYPE,
        p_start_date IN DATE,
        p_end_date IN DATE,
        p_avg_change OUT NUMBER,
        p_initial_weight OUT NUMBER,
        p_final_weight OUT NUMBER,
        p_measurement_count OUT NUMBER,
        p_success OUT NUMBER
    );
*/
    -- II. Trainer Statistics
    FUNCTION GetTotalTrainerCount RETURN NUMBER;

    FUNCTION GetTrainerCountBySpecialization_Typed RETURN SYS_REFCURSOR; -- ZMIANA

    FUNCTION GetTrainerWorkloadStats_Typed RETURN SYS_REFCURSOR; -- ZMIANA


    -- III. Exercise and Plan Statistics
    PROCEDURE GetExerciseCountByMuscleGroup (
        p_exercise_muscle_group_stats OUT SYS_REFCURSOR,
        p_success OUT NUMBER -- ZMIANA
    );

    FUNCTION GetMostPopularExercisesInPlans_Typed (
        p_top_n IN NUMBER DEFAULT 10
    ) RETURN SYS_REFCURSOR; -- ZMIANA

    FUNCTION GetMostPopularExercisesInLeaderboard_Typed (
        p_top_n IN NUMBER DEFAULT 10
    ) RETURN SYS_REFCURSOR; -- ZMIANA

    PROCEDURE GetMostAssignedTrainingPlans (
        p_top_n IN NUMBER DEFAULT 5,
        p_popular_plans OUT SYS_REFCURSOR,
        p_success OUT NUMBER -- ZMIANA
    );

    -- IV. Leaderboard Statistics
    PROCEDURE GetLeaderboardRankingsForExercise (
        p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
        p_top_n IN NUMBER DEFAULT 10,
        p_rankings OUT SYS_REFCURSOR,
        p_success OUT NUMBER -- ZMIANA
    );

    -- V. System Activity Statistics
    PROCEDURE GetOverallSystemActivityCounts (
        p_activity_counts OUT SYS_REFCURSOR,
        p_success OUT NUMBER -- ZMIANA
    );

END PKG_APP_STATISTICS;
/

-- Ciało Pakietu
CREATE OR REPLACE PACKAGE BODY PKG_APP_STATISTICS AS

    FUNCTION GetTotalUserCount RETURN NUMBER AS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM USERS;
        RETURN v_count;
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error in GetTotalUserCount: ' || SQLERRM);
            RETURN -1;
    END GetTotalUserCount;

    FUNCTION GetUserCountByRole_Typed RETURN SYS_REFCURSOR AS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT role as role_name, COUNT(*) as user_count
            FROM USERS
            GROUP BY role
            ORDER BY user_count DESC;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN
            IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetUserCountByRole_Typed: ' || SQLERRM);
            RAISE;
    END GetUserCountByRole_Typed;

    PROCEDURE GetNewUsersByPeriod (
        p_start_date IN DATE,
        p_end_date IN DATE,
        p_new_user_stats OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    ) AS
    BEGIN
        p_success := 0;
        OPEN p_new_user_stats FOR
            SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as creation_date, COUNT(*) as new_users_count
            FROM USERS
            WHERE created_at >= TRUNC(p_start_date) AND created_at < TRUNC(p_end_date) + 1
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY creation_date;
        p_success := 1;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            IF p_new_user_stats%ISOPEN THEN CLOSE p_new_user_stats; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetNewUsersByPeriod: ' || SQLERRM);
            RAISE;
    END GetNewUsersByPeriod;

/*
    PROCEDURE GetUserAverageWeightChange (
        p_user_id IN USERS.USER_ID%TYPE,
        p_start_date IN DATE,
        p_end_date IN DATE,
        p_avg_change OUT NUMBER,
        p_initial_weight OUT NUMBER,
        p_final_weight OUT NUMBER,
        p_measurement_count OUT NUMBER,
        p_success OUT NUMBER
    ) AS
        v_user_exists NUMBER;
    BEGIN
        p_success := 0;
        p_avg_change := NULL;
        p_initial_weight := NULL;
        p_final_weight := NULL;
        p_measurement_count := 0;

        SELECT COUNT(*) INTO v_user_exists FROM USERS WHERE user_id = p_user_id;
        IF v_user_exists = 0 THEN
            DBMS_OUTPUT.PUT_LINE('User with ID ' || p_user_id || ' does not exist.');
            RETURN;
        END IF;

        WITH UserMeasurements AS (
            SELECT weight, measurement_date,
                   ROW_NUMBER() OVER (ORDER BY measurement_date ASC) as rn_asc,
                   ROW_NUMBER() OVER (ORDER BY measurement_date DESC) as rn_desc,
                   COUNT(*) OVER () as total_measurements
            FROM WEIGHT_MEASUREMENTS
            WHERE user_id = p_user_id
              AND measurement_date >= TRUNC(p_start_date) AND measurement_date < TRUNC(p_end_date) + 1
        )
        SELECT
            MAX(CASE WHEN rn_asc = 1 THEN weight END),
            MAX(CASE WHEN rn_desc = 1 THEN weight END),
            NVL(MAX(total_measurements),0)
        INTO p_initial_weight, p_final_weight, p_measurement_count
        FROM UserMeasurements;

        IF p_measurement_count >= 2 THEN
            p_avg_change := p_final_weight - p_initial_weight;
            p_success := 1;
        ELSIF p_measurement_count = 1 THEN
             p_initial_weight := p_final_weight;
             p_avg_change := 0;
             p_success := 1;
        ELSE
            p_success := 1;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            DBMS_OUTPUT.PUT_LINE('Error in GetUserAverageWeightChange for user ' || p_user_id || ': ' || SQLERRM);
            RAISE;
    END GetUserAverageWeightChange;
*/

    FUNCTION GetTotalTrainerCount RETURN NUMBER AS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM TRAINERS;
        RETURN v_count;
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error in GetTotalTrainerCount: ' || SQLERRM);
            RETURN -1;
    END GetTotalTrainerCount;

    FUNCTION GetTrainerCountBySpecialization_Typed RETURN SYS_REFCURSOR AS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT specialization as specialization_name, COUNT(*) as trainer_count
            FROM TRAINERS
            WHERE specialization IS NOT NULL
            GROUP BY specialization
            ORDER BY trainer_count DESC;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN
            IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetTrainerCountBySpecialization_Typed: ' || SQLERRM);
            RAISE;
    END GetTrainerCountBySpecialization_Typed;

    FUNCTION GetTrainerWorkloadStats_Typed RETURN SYS_REFCURSOR AS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT
                t.trainer_id,
                t.name || ' ' || t.surname AS trainer_full_name,
                t.specialization,
                COUNT(DISTINCT pp.user_id) AS assigned_clients_count,
                NVL(ts_total.session_count, 0) AS total_scheduled_sessions,
                NVL(ts_next_week.session_count, 0) AS sessions_next_7_days
            FROM
                TRAINERS t
                    LEFT JOIN PERSONAL_PLANS pp ON t.trainer_id = pp.trainer_id
                    LEFT JOIN (
                    SELECT trainer_id, COUNT(*) as session_count
                    FROM TRAINER_SESSIONS
                    GROUP BY trainer_id
                ) ts_total ON t.trainer_id = ts_total.trainer_id
                    LEFT JOIN (
                    SELECT trainer_id, COUNT(*) as session_count
                    FROM TRAINER_SESSIONS
                    WHERE session_date >= TRUNC(SYSDATE) AND session_date < TRUNC(SYSDATE) + 7
                    GROUP BY trainer_id
                ) ts_next_week ON t.trainer_id = ts_next_week.trainer_id
            GROUP BY
                t.trainer_id, t.name, t.surname, t.specialization,
                ts_total.session_count, ts_next_week.session_count
            ORDER BY
                assigned_clients_count DESC, trainer_full_name;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN
            IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetTrainerWorkloadStats_Typed: ' || SQLERRM);
            RAISE;
    END GetTrainerWorkloadStats_Typed;

    PROCEDURE GetExerciseCountByMuscleGroup (
        p_exercise_muscle_group_stats OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    ) AS
    BEGIN
        p_success := 0;
        OPEN p_exercise_muscle_group_stats FOR
            SELECT
                mg.group_name,
                COUNT(e.exercise_id) as exercise_count
            FROM
                MUSCLE_GROUPS mg
                    LEFT JOIN EXERCISES e ON mg.group_id = e.group_id
            GROUP BY
                mg.group_id, mg.group_name
            ORDER BY
                exercise_count DESC, mg.group_name;
        p_success := 1;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            IF p_exercise_muscle_group_stats%ISOPEN THEN CLOSE p_exercise_muscle_group_stats; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetExerciseCountByMuscleGroup: ' || SQLERRM);
            RAISE;
    END GetExerciseCountByMuscleGroup;

    FUNCTION GetMostPopularExercisesInPlans_Typed (
        p_top_n IN NUMBER DEFAULT 10
    ) RETURN SYS_REFCURSOR AS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT * FROM (
                              SELECT
                                  e.name as exercise_name,
                                  mg.group_name as muscle_group,
                                  COUNT(te.plan_id) as count_value
                              FROM
                                  EXERCISES e
                                      JOIN TRAINING_EXERCISE te ON e.exercise_id = te.exercise_id
                                      JOIN MUSCLE_GROUPS mg ON e.group_id = mg.group_id
                              GROUP BY
                                  e.exercise_id, e.name, mg.group_name
                              ORDER BY
                                  count_value DESC, exercise_name ASC
                          )
            WHERE ROWNUM <= p_top_n;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN
            IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetMostPopularExercisesInPlans_Typed: ' || SQLERRM);
            RAISE;
    END GetMostPopularExercisesInPlans_Typed;

    FUNCTION GetMostPopularExercisesInLeaderboard_Typed (
        p_top_n IN NUMBER DEFAULT 10
    ) RETURN SYS_REFCURSOR AS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT * FROM (
                              SELECT
                                  e.name as exercise_name,
                                  mg.group_name as muscle_group,
                                  COUNT(wl.result_id) as count_value
                              FROM
                                  EXERCISES e
                                      JOIN WEIGHT_LEADERBOARD wl ON e.exercise_id = wl.exercise_id
                                      JOIN MUSCLE_GROUPS mg ON e.group_id = mg.group_id
                              GROUP BY
                                  e.exercise_id, e.name, mg.group_name
                              ORDER BY
                                  count_value DESC, exercise_name ASC
                          )
            WHERE ROWNUM <= p_top_n;
        RETURN v_cursor;
    EXCEPTION
        WHEN OTHERS THEN
            IF v_cursor%ISOPEN THEN CLOSE v_cursor; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetMostPopularExercisesInLeaderboard_Typed: ' || SQLERRM);
            RAISE;
    END GetMostPopularExercisesInLeaderboard_Typed;

    PROCEDURE GetMostAssignedTrainingPlans (
        p_top_n IN NUMBER DEFAULT 5,
        p_popular_plans OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    ) AS
    BEGIN
        p_success := 0;
        OPEN p_popular_plans FOR
            SELECT * FROM (
                              SELECT
                                  tp.name as plan_name,
                                  COUNT(pp.user_id) as assignments_count
                              FROM
                                  TRAINING_PLANS tp
                                      JOIN PERSONAL_PLANS pp ON tp.plan_id = pp.plan_id
                              GROUP BY
                                  tp.plan_id, tp.name
                              ORDER BY
                                  assignments_count DESC, tp.name
                          )
            WHERE ROWNUM <= p_top_n;
        p_success := 1;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            IF p_popular_plans%ISOPEN THEN CLOSE p_popular_plans; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetMostAssignedTrainingPlans: ' || SQLERRM);
            RAISE;
    END GetMostAssignedTrainingPlans;

    PROCEDURE GetLeaderboardRankingsForExercise (
        p_exercise_id IN EXERCISES.EXERCISE_ID%TYPE,
        p_top_n IN NUMBER DEFAULT 10,
        p_rankings OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    ) AS
        v_exercise_exists NUMBER;
    BEGIN
        p_success := 0;
        SELECT COUNT(*) INTO v_exercise_exists FROM EXERCISES WHERE exercise_id = p_exercise_id;
        IF v_exercise_exists = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Exercise with ID ' || p_exercise_id || ' does not exist.');
            OPEN p_rankings FOR SELECT NULL AS DUMMY FROM DUAL WHERE 1=0;
            RETURN;
        END IF;

        OPEN p_rankings FOR
            SELECT * FROM (
                              SELECT
                                  u.username,
                                  e.name AS exercise_name,
                                  wl.weight,
                                  wl.measurement_date,
                                  DENSE_RANK() OVER (PARTITION BY wl.exercise_id ORDER BY wl.weight DESC, wl.measurement_date ASC) as exercise_rank
                              FROM
                                  WEIGHT_LEADERBOARD wl
                                      JOIN USERS u ON wl.user_id = u.user_id
                                      JOIN EXERCISES e ON wl.exercise_id = e.exercise_id
                              WHERE
                                  wl.exercise_id = p_exercise_id
                          )
            WHERE exercise_rank <= p_top_n
            ORDER BY exercise_rank, measurement_date DESC;
        p_success := 1;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            IF p_rankings%ISOPEN THEN CLOSE p_rankings; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetLeaderboardRankingsForExercise: ' || SQLERRM);
            RAISE;
    END GetLeaderboardRankingsForExercise;

    PROCEDURE GetOverallSystemActivityCounts (
        p_activity_counts OUT SYS_REFCURSOR,
        p_success OUT NUMBER
    ) AS
    BEGIN
        p_success := 0;
        OPEN p_activity_counts FOR
            SELECT 'Total Users' AS metric, COUNT(*) AS count FROM USERS
            UNION ALL
            SELECT 'Total Trainers' AS metric, COUNT(*) AS count FROM TRAINERS
            UNION ALL
            SELECT 'Total Muscle Groups' AS metric, COUNT(*) AS count FROM MUSCLE_GROUPS
            UNION ALL
            SELECT 'Total Exercises' AS metric, COUNT(*) AS count FROM EXERCISES
            UNION ALL
            SELECT 'Total Training Plans' AS metric, COUNT(*) AS count FROM TRAINING_PLANS
            UNION ALL
            SELECT 'Total Personal Plan Assignments' AS metric, COUNT(*) AS count FROM PERSONAL_PLANS
            UNION ALL
            SELECT 'Total Exercise-Plan Links' AS metric, COUNT(*) AS count FROM TRAINING_EXERCISE
            UNION ALL
            SELECT 'Total Trainer Sessions' AS metric, COUNT(*) AS count FROM TRAINER_SESSIONS
            UNION ALL
            SELECT 'Total Weight Measurements' AS metric, COUNT(*) AS count FROM WEIGHT_MEASUREMENTS
            UNION ALL
            SELECT 'Total Leaderboard Entries' AS metric, COUNT(*) AS count FROM WEIGHT_LEADERBOARD;
        p_success := 1;
    EXCEPTION
        WHEN OTHERS THEN
            p_success := 0;
            IF p_activity_counts%ISOPEN THEN CLOSE p_activity_counts; END IF;
            DBMS_OUTPUT.PUT_LINE('Error in GetOverallSystemActivityCounts: ' || SQLERRM);
            RAISE;
    END GetOverallSystemActivityCounts;

END PKG_APP_STATISTICS;
/