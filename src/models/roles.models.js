import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const rolesModel = sequelize.define(
  "Role",
  {
    id_role: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "role",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
