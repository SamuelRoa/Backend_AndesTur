import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const MunicipalityModel = sequelize.define(
  "Municipality",
  {
    id_municipality: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    id_state: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    postal_code: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "municipality",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
