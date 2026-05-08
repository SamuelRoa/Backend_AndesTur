import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const PackagesDestinationsModel = sequelize.define(
  "PackageDestination",
  {
    id_package_destination: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_destination: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_visit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "packages_destinations",
    timestamps: false,
  },
);
