import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import "./models/index.js";
import { destinationsModel } from "./models/destinations.models.js";
import { staffModel } from "./models/staff.models.js";
import { StaffDocumentsModel } from "./models/staff_documents.models.js";
import { StaffScheduleModel } from "./models/staff_schedules.models.js";
import { StaffExceptionModel } from "./models/staff_schedule_exceptions.models.js";
import { trashModel } from "./models/trash.models.js";
import routes from "./routes.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";
import { swaggerDocs } from "./swagger.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

swaggerDocs(app);
app.use("/api", routes);

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo centralizado de errores (debe ir al final)
app.use(errorHandler);

const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== "test") {
      await sequelize.authenticate();
      // ── Staff migration: STRING instead of ENUM to avoid cast issues ──
      try { await sequelize.query(`ALTER TABLE staff ALTER COLUMN type TYPE VARCHAR(50) USING type::text;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS email VARCHAR(100);`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS birth_date DATE;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS position VARCHAR(100);`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS hire_date DATE;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_status VARCHAR(20) DEFAULT 'active';`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS notes TEXT;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0;`); } catch (_) {}

      // ── Sync new tables ──
      await destinationsModel.sync({ alter: true });
      await StaffDocumentsModel.sync({ alter: true });
      await StaffScheduleModel.sync({ alter: true });
      await StaffExceptionModel.sync({ alter: true });
      await trashModel.sync({ alter: true });

      // Add/alter columns for destination reservations
      try { await sequelize.query(`ALTER TABLE reservations ALTER COLUMN id_package DROP NOT NULL;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS id_destination INTEGER;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS travel_date DATE;`); } catch (_) {}
      try { await sequelize.query(`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS num_people INTEGER DEFAULT 2;`); } catch (_) {}
      console.log("✅ Conexión a la base de datos establecida");
      app.listen(port, () => {
        console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
      });

      // Iniciar tareas programadas
      try {
        const { startWeeklyReportTask } = await import('./tasks/weeklyReport.task.js');
        startWeeklyReportTask();
        const { startTrashCleanupTask } = await import('./tasks/trashCleanup.task.js');
        startTrashCleanupTask();
      } catch (err) {
        console.error('No se pudo iniciar tareas programadas:', err.message);
      }
    }
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
