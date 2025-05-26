CREATE OR REPLACE TRIGGER trg_weight_measurements_validate
    BEFORE INSERT OR UPDATE ON weight_measurements
    FOR EACH ROW
BEGIN
    IF :NEW.weight <= 0 THEN
        RAISE_APPLICATION_ERROR(-20104, 'Waga (weight) w tabeli weight_measurements musi być wartością dodatnią.');
    END IF;
END;
/