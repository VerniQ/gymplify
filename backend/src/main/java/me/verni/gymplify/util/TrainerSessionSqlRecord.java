package me.verni.gymplify.util;

import lombok.Getter;
import lombok.Setter;
import me.verni.gymplify.dto.TrainerSessionDto;

import java.sql.SQLData;
import java.sql.SQLException;
import java.sql.SQLInput;
import java.sql.SQLOutput;
import java.sql.Timestamp;
import java.sql.Date;

@Getter
@Setter
public class TrainerSessionSqlRecord implements SQLData {

    public static final String SQL_TYPE_NAME = "PKG_TRAINER_SESSION_MGMT.TY_TRAINER_SESSION_RECORD";

    private Long scheduleId;
    private Long trainerId;
    private String trainerName;
    private String trainerSurname;
    private Date sessionDate;
    private Timestamp startTime;
    private Timestamp endTime;

    public TrainerSessionSqlRecord() {}

    @Override
    public String getSQLTypeName() throws SQLException {
        return SQL_TYPE_NAME;
    }

    @Override
    public void readSQL(SQLInput stream, String typeName) throws SQLException {
        setScheduleId(stream.readLong());
        setTrainerId(stream.readLong());
        setTrainerName(stream.readString());
        setTrainerSurname(stream.readString());
        setSessionDate(stream.readDate());
        setStartTime(stream.readTimestamp());
        setEndTime(stream.readTimestamp());
    }

    @Override
    public void writeSQL(SQLOutput stream) throws SQLException {
        stream.writeLong(getScheduleId());
        stream.writeLong(getTrainerId());
        stream.writeString(getTrainerName());
        stream.writeString(getTrainerSurname());
        stream.writeDate(getSessionDate());
        stream.writeTimestamp(getStartTime());
        stream.writeTimestamp(getEndTime());
    }

    public TrainerSessionDto toDto() {
        return new TrainerSessionDto(
                this.scheduleId,
                this.trainerId,
                this.trainerName,
                this.trainerSurname,
                this.sessionDate != null ? this.sessionDate.toLocalDate() : null,
                this.startTime != null ? this.startTime.toLocalDateTime() : null,
                this.endTime != null ? this.endTime.toLocalDateTime() : null
        );
    }
}