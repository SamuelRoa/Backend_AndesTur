import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const destinationsModel = sequelize.define(
  "Destination",
  {
    id_destination: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_municipality: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "destinations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
