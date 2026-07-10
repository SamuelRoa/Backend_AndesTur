import sequelize from "../config/db.js";
import "../models/index.js";
import { rolesModel } from "../models/roles.models.js";

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos");

    const operatorRole = await rolesModel.findOne({ where: { type: "operator" } });
    if (!operatorRole) {
      console.log("Rol 'operator' no encontrado.");
      process.exit(1);
    }

    const currentPermissions = operatorRole.permissions || [];
    const newPerm = "payment-header:read";

    if (currentPermissions.includes(newPerm)) {
      console.log("El permiso ya existe. No se requiere cambio.");
    } else {
      currentPermissions.push(newPerm);
      await operatorRole.update({ permissions: currentPermissions });
      console.log(`Permiso "${newPerm}" agregado al rol ${operatorRole.type}.`);
    }

    console.log("Permisos actuales del rol:", currentPermissions);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
