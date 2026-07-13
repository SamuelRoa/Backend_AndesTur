import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const PaymentDetailModel = sequelize.define(
  "PaymentDetail",
  {
    id_payment_detail: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_payment_header: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pay_method: {
      type: DataTypes.ENUM("cash", "card", "zelle", "pago_movil", "digital_transfer", "paypal"),
      allowNull: false,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING(100),
    },
    payment_date: {
      type: DataTypes.DATEONLY,
    },
  },
  {
    tableName: "payment_detail",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
