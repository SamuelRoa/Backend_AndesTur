import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const usersModel = sequelize.define(
  "User",
  {
    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    state: {
      type: DataTypes.ENUM("active", "inactive", "blocked"),
      defaultValue: "active",
    },
    id_role: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
