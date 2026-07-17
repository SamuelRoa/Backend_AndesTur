import sequelize from "../config/db.js";
import { expirePastReservations } from "../utils/reservationExpiry.js";

const run = async () => {
  try {
    console.log("Conectando a la base de datos para expirar reservaciones pasadas...");
    await sequelize.authenticate();
    console.log("Conexión exitosa.");
    const count = await expirePastReservations();
    console.log(`Proceso completado. Se expiraron ${count} reservaciones.`);
  } catch (error) {
    console.error("Error al ejecutar el script de expiración:", error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

run();
