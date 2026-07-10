import sequelize from "../config/db.js";
import "../models/index.js";
import { rolesModel } from "../models/roles.models.js";
import { usersModel } from "../models/users.models.js";

const cleanup = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos");

    const roleTypes = ["staff", "agent"];
    const roles = await rolesModel.findAll({
      where: { type: roleTypes },
    });

    if (roles.length === 0) {
      console.log("No se encontraron roles 'staff' o 'agent'. Nada que limpiar.");
      process.exit(0);
    }

    console.log(`Roles encontrados: ${roles.map((r) => `"${r.type}"`).join(", ")}`);

    const roleIds = roles.map((r) => r.id_role);

    const usersToDelete = await usersModel.findAll({
      where: { id_role: roleIds },
    });

    if (usersToDelete.length > 0) {
      console.log(`Usuarios a eliminar (${usersToDelete.length}):`);
      usersToDelete.forEach((u) => {
        const userRole = roles.find((r) => r.id_role === u.id_role);
        console.log(`  - ${u.username} (${u.email}) — rol: ${userRole?.type || "desconocido"}`);
      });

      await usersModel.destroy({
        where: { id_user: usersToDelete.map((u) => u.id_user) },
      });
      console.log(`Usuarios eliminados: ${usersToDelete.length}`);
    } else {
      console.log("No hay usuarios asociados a estos roles.");
    }

    for (const role of roles) {
      await rolesModel.destroy({
        where: { id_role: role.id_role },
      });
    }
    console.log(`Roles eliminados: ${roles.length}`);

    console.log("Limpieza completada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la limpieza:", error);
    process.exit(1);
  }
};

cleanup();
