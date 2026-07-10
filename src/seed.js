import sequelize from "./config/db.js";
import "./models/index.js";
import { rolesModel } from "./models/roles.models.js";
import { usersModel } from "./models/users.models.js";

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos");

    await sequelize.sync();
    console.log("Tablas sincronizadas");

    try {
      await sequelize.query('ALTER TABLE role ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT \'[]\'');
      console.log("Columna permissions agregada/verificada en tabla role");
    } catch (e) {
      console.log("Nota: Columna permissions ya existía o error menor:", e.message);
    }

    const rolesCount = await rolesModel.count();
    if (rolesCount === 0) {
      await rolesModel.bulkCreate([
        { type: "admin", description: "Administrador del sistema", permissions: ["*"] },
        { type: "operator", description: "Operador turístico", permissions: ["reservations:read", "reservations:write", "destinations:read", "packages:read", "customers:read", "customers:write", "payment-header:read"] },
      ]);
      console.log("Roles creados: admin, operator");
    } else {
      // Ensure existing roles have the correct default permissions if they don't have them
      await rolesModel.update({ permissions: ["*"] }, { where: { type: "admin" } });
      await rolesModel.update(
        { permissions: ["reservations:read", "reservations:write", "destinations:read", "packages:read", "customers:read", "customers:write", "payment-header:read"] }, 
        { where: { type: "operator" } }
      );
      console.log("Roles ya existen, permisos actualizados...");
    }

    const adminRole = await rolesModel.findOne({ where: { type: "admin" } });
    const existingAdmin = await usersModel.findOne({ where: { email: "admin@andetur.com" } });

    if (!existingAdmin) {
      await usersModel.create({
        username: "admin",
        email: "admin@andetur.com",
        password: "admin123",
        state: "active",
        id_role: adminRole.id_role,
      });
      console.log("Usuario admin creado: admin@andetur.com / admin123");
    } else {
      existingAdmin.username = "admin";
      existingAdmin.password = "admin123";
      existingAdmin.state = "active";
      existingAdmin.id_role = adminRole.id_role;
      await existingAdmin.save();
      console.log("Usuario admin actualizado: admin@andetur.com / admin123");
    }

    console.log("Seed completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("Error en seed:", error);
    process.exit(1);
  }
};

seed();
