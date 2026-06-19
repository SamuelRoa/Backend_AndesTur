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
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "destinations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
