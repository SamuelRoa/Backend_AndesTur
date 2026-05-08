import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Ajusta la ruta a tu configuración de conexión

export const StateModel = sequelize.define(
  "State",
  {
    id_state: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "state",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
