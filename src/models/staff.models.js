import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const staffModel = sequelize.define(
  "Staff",
  {
    id_staff: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    email: {
      type: DataTypes.STRING(100),
    },
    address: {
      type: DataTypes.TEXT,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
    },
    position: {
      type: DataTypes.STRING(100),
    },
    emergency_contact: {
      type: DataTypes.STRING(100),
    },
    emergency_phone: {
      type: DataTypes.STRING(20),
    },
    hire_date: {
      type: DataTypes.DATEONLY,
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
    },
    employment_status: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
    },
    notes: {
      type: DataTypes.TEXT,
    },
    id_user: {
      type: DataTypes.INTEGER,
      unique: true,
    },
  },
  {
    tableName: "staff",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeSync: () => console.log("staffModel synced (no ENUM issues)"),
    },
  },
);
