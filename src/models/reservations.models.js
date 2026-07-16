import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const reservationsModel = sequelize.define(
  "Reservation",
  {
    id_reservation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_package: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_destination: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_customer: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reservation_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    travel_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    num_people: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
    },
    pay_state: {
      type: DataTypes.ENUM(
        "pending",
        "partial",
        "paid",
        "cancelled",
        "expired",
        "rejected",
      ),
      defaultValue: "pending",
    },
  },
  {
    tableName: "reservations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
