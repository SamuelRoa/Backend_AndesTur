import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const packagesModel = sequelize.define(
  "Package",
  {
    id_package: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    departure_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    return_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    id_vehicle: {
      type: DataTypes.INTEGER,
    },
    available_places: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "packages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
