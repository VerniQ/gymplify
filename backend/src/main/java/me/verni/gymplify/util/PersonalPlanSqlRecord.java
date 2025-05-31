package me.verni.gymplify.util;

import lombok.Getter;
import lombok.Setter;
import me.verni.gymplify.dto.PersonalPlanDto;

import java.sql.SQLData;
import java.sql.SQLException;
import java.sql.SQLInput;
import java.sql.SQLOutput;

@Getter
@Setter
public class PersonalPlanSqlRecord implements SQLData {

    public static final String SQL_TYPE_NAME = "PKG_PERSONAL_PLAN_MGMT.TY_PERSONAL_PLAN_RECORD";

    private Long personalPlanId;
    private Long userId;
    private String username;
    private Long trainerId;
    private String trainerName;
    private String trainerSurname;
    private Long planId;
    private String planName;

    public PersonalPlanSqlRecord() {}

    @Override
    public String getSQLTypeName() throws SQLException {
        return SQL_TYPE_NAME;
    }

    @Override
    public void readSQL(SQLInput stream, String typeName) throws SQLException {
        setPersonalPlanId(stream.readLong());
        setUserId(stream.readLong());
        setUsername(stream.readString());
        setTrainerId(stream.readLong());
        setTrainerName(stream.readString());
        setTrainerSurname(stream.readString());
        setPlanId(stream.readLong());
        setPlanName(stream.readString());
    }

    @Override
    public void writeSQL(SQLOutput stream) throws SQLException {
        stream.writeLong(getPersonalPlanId());
        stream.writeLong(getUserId());
        stream.writeString(getUsername());
        stream.writeLong(getTrainerId());
        stream.writeString(getTrainerName());
        stream.writeString(getTrainerSurname());
        stream.writeLong(getPlanId());
        stream.writeString(getPlanName());
    }

    public PersonalPlanDto toDto() {
        return new PersonalPlanDto(
                this.personalPlanId,
                this.userId,
                this.username,
                this.trainerId,
                this.trainerName,
                this.trainerSurname,
                this.planId,
                this.planName
        );
    }
}