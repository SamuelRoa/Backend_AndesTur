import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    define: {
      underscored: true,
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === "true",
    },
  },
);

export default sequelize;
