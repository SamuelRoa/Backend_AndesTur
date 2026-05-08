import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const VehiclesModel = sequelize.define(
  "Vehicle",
  {
    id_vehicle: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plate: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    brand: {
      type: DataTypes.STRING(50),
    },
    model: {
      type: DataTypes.STRING(50),
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
    },
  },
  {
    tableName: "vehicles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
