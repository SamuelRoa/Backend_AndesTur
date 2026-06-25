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

    const rolesCount = await rolesModel.count();
    if (rolesCount === 0) {
      await rolesModel.bulkCreate([
        { type: "admin", description: "Administrador del sistema" },
        { type: "operator", description: "Operador turístico" },
      ]);
      console.log("Roles creados: admin, operator");
    } else {
      console.log("Roles ya existen, saltando...");
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
