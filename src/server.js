import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import "./models/index.js";
import routes from "./routes.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo centralizado de errores (debe ir al final)
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("✅ Conexión a la base de datos establecida");
    app.listen(port, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
    });
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
    process.exit(1);
  }
};

startServer();
