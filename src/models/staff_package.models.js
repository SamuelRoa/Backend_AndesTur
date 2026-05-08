import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const StaffPackageModel = sequelize.define(
  "StaffPackage",
  {
    id_staff_package: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_staff: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "staff_package",
    timestamps: false,
  },
);
