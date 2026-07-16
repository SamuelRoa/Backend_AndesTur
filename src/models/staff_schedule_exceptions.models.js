import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const StaffExceptionModel = sequelize.define(
  "StaffException",
  {
    id_exception: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    is_working_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    start_time: {
      type: DataTypes.TIME,
    },
    end_time: {
      type: DataTypes.TIME,
    },
    attachment_path: {
      type: DataTypes.STRING(500),
    },
    attachment_name: {
      type: DataTypes.STRING(255),
    },
    attachment_mime: {
      type: DataTypes.STRING(100),
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "staff_schedule_exceptions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);