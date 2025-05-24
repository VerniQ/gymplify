
CREATE SEQUENCE muscle_groups_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE PROCEDURE prc_add_muscle_group(
    p_group_name IN VARCHAR2,
    p_description IN CLOB,
    p_success OUT BOOLEAN
) AS
BEGIN
    p_success := FALSE;

    INSERT INTO MUSCLE_GROUPS (
        group_id,
        group_name,
        description
    ) VALUES (
                 muscle_groups_seq.NEXTVAL,
                 p_group_name,
                 p_description
             );

    COMMIT;
    p_success := TRUE;
    DBMS_OUTPUT.PUT_LINE('Grupa mięśniowa "' || p_group_name || '" została dodana.');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_success := FALSE;
        DBMS_OUTPUT.PUT_LINE('Błąd podczas dodawania grupy mięśniowej: ' || SQLERRM);
END prc_add_muscle_group;
/