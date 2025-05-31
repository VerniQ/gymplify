package me.verni.gymplify.util;

import lombok.Getter;
import lombok.Setter;
import me.verni.gymplify.dto.UserInPersonalPlanDto;

import java.sql.SQLData;
import java.sql.SQLException;
import java.sql.SQLInput;
import java.sql.SQLOutput;

@Getter
@Setter
public class UserInPersonalPlanSqlRecord implements SQLData {

    public static final String SQL_TYPE_NAME = "PKG_PERSONAL_PLAN_MGMT.TY_USER_IN_PERSONAL_PLAN_RECORD";

    private Long personalPlanId;
    private Long userId;
    private String username;
    private String email;
    private Long trainerId;
    private String trainerName;
    private String trainerSurname;

    public UserInPersonalPlanSqlRecord() {}

    @Override
    public String getSQLTypeName() throws SQLException {
        return SQL_TYPE_NAME;
    }

    @Override
    public void readSQL(SQLInput stream, String typeName) throws SQLException {
        setPersonalPlanId(stream.readLong());
        setUserId(stream.readLong());
        setUsername(stream.readString());
        setEmail(stream.readString());
        setTrainerId(stream.readLong());
        setTrainerName(stream.readString());
        setTrainerSurname(stream.readString());
    }

    @Override
    public void writeSQL(SQLOutput stream) throws SQLException {
        stream.writeLong(getPersonalPlanId());
        stream.writeLong(getUserId());
        stream.writeString(getUsername());
        stream.writeString(getEmail());
        stream.writeLong(getTrainerId());
        stream.writeString(getTrainerName());
        stream.writeString(getTrainerSurname());
    }

    public UserInPersonalPlanDto toDto() {
        return new UserInPersonalPlanDto(
                this.personalPlanId,
                this.userId,
                this.username,
                this.email,
                this.trainerId,
                this.trainerName,
                this.trainerSurname
        );
    }
}