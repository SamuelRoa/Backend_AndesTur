import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const staffModel = sequelize.define(
  "Staff",
  {
    id_staff: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("guide", "driver"),
      allowNull: false,
    },
    id_user: {
      type: DataTypes.INTEGER,
      unique: true,
    },
  },
  {
    tableName: "staff",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
