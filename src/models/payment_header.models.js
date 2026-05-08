import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const PaymentHeaderModel = sequelize.define(
  "PaymentHeader",
  {
    id_payment_header: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_reservation: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "payment_header",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
