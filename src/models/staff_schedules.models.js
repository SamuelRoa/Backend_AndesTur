import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const StaffScheduleModel = sequelize.define(
  "StaffSchedule",
  {
    id_schedule: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "staff_schedules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);