CREATE SEQUENCE muscle_groups_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE prc_add_muscle_group(
    p_group_name IN VARCHAR2,
    p_description IN CLOB,
    p_new_group_id OUT NUMBER, 
    p_success OUT BOOLEAN
) AS
    v_generated_id NUMBER;
BEGIN
    p_success := FALSE;
    p_new_group_id := NULL;

    v_generated_id := muscle_groups_seq.NEXTVAL;

    INSERT INTO MUSCLE_GROUPS (
        group_id,
        group_name,
        description
    ) VALUES (
        v_generated_id,
        p_group_name,
        p_description
    );

    COMMIT;
    p_new_group_id := v_generated_id;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa "' || p_group_name || '" została dodana z ID: ' || v_generated_id);

EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN 
        ROLLBACK;
        p_success := FALSE;
        p_new_group_id := NULL;
        DBMS_OUTPUT.PUT_LINE('Błąd PL/SQL: Grupa mięśniowa o nazwie "' || p_group_name || '" już istnieje. (ORA-00001)');
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        p_new_group_id := NULL;
        DBMS_OUTPUT.PUT_LINE('Błąd PL/SQL podczas dodawania grupy mięśniowej: ' || SQLCODE || ' - ' || SQLERRM);
        RAISE; 
END prc_add_muscle_group;
/