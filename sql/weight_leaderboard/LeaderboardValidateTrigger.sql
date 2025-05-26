CREATE OR REPLACE TRIGGER trg_leaderboard_validate
    BEFORE INSERT OR UPDATE ON weight_leaderboard
    FOR EACH ROW
DECLARE
    v_user_count NUMBER;
    v_exercise_count NUMBER;
BEGIN
    IF :NEW.weight <= 0 THEN
        RAISE_APPLICATION_ERROR(-20203, 'Waga w leaderboard musi być wartością dodatnią.');
    END IF;

    SELECT COUNT(*) INTO v_user_count FROM USERS WHERE user_id = :NEW.user_id;
    IF v_user_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Użytkownik o ID ' || :NEW.user_id || ' nie istnieje. Nie można dodać wpisu do leaderboard.');
    END IF;

    SELECT COUNT(*) INTO v_exercise_count FROM EXERCISES WHERE exercise_id = :NEW.exercise_id;
    IF v_exercise_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20011, 'Ćwiczenie o ID ' || :NEW.exercise_id || ' nie istnieje. Nie można dodać wpisu do leaderboard.');
    END IF;
END;
/