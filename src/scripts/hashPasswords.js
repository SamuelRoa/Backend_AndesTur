import sequelize from "../config/db.js";
import bcrypt from "bcrypt";
import "../models/index.js";
import { usersModel } from "../models/users.models.js";

const hashPasswords = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos");

    const users = await usersModel.findAll();
    let updated = 0;

    for (const user of users) {
      const pw = user.password;
      // Si NO tiene formato de hash bcrypt ($2b$...), lo hasheamos
      if (!pw || !pw.startsWith("$2")) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(pw, salt);
        await user.save();
        updated++;
        console.log(`✓ ${user.email} — contraseña hasheada`);
      }
    }

    console.log(`\nProceso completado: ${updated} contraseñas hasheadas`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

hashPasswords();
