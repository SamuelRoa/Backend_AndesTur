import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return { buffer, contentType };
}

async function main() {
  console.log("=== Migración a Cloudinary ===\n");

  const { Op } = await import("sequelize");
  const { StaffDocumentsModel } = await import("../models/staff_documents.models.js");
  const { usersModel } = await import("../models/users.models.js");
  const { destinationsModel } = await import("../models/destinations.models.js");
  const { uploadBuffer } = await import("../utils/cloudinary.js");

  // ── 1. Migrar staff_documents ──────────────────────────────
  console.log("── Migrando documentos de empleados ──\n");

  const docs = await StaffDocumentsModel.findAll({
    order: [["id_document", "ASC"]],
  });

  let migratedDocs = 0;
  let skippedDocs = 0;
  let failedDocs = 0;

  for (const doc of docs) {
    if (doc.file_path?.startsWith("http")) {
      console.log(`  [SKIP] #${doc.id_document} ya está en la nube: ${doc.file_path.slice(0, 60)}...`);
      skippedDocs++;
      continue;
    }

    const absolutePath = path.resolve(doc.file_path);
    if (!fs.existsSync(absolutePath)) {
      console.log(`  [FAIL] #${doc.id_document} archivo no encontrado: ${absolutePath}`);
      failedDocs++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(absolutePath);
      const publicId = `${doc.id_staff}_${Date.now()}_migrated`;
      const result = await uploadBuffer(buffer, {
        public_id: publicId,
        resource_type: "auto",
      });

      const oldPath = doc.file_path;
      await doc.update({ file_path: result.secure_url });
      console.log(`  [OK]   #${doc.id_document} → ${result.secure_url}`);

      fs.unlinkSync(absolutePath);
      console.log(`  [DEL]  Archivo local eliminado: ${absolutePath}`);

      migratedDocs++;
    } catch (err) {
      console.log(`  [FAIL] #${doc.id_document} error: ${err.message}`);
      failedDocs++;
    }
  }

  console.log(`\nResultado documentos: ${migratedDocs} migrados, ${skippedDocs} saltados, ${failedDocs} fallidos\n`);

  // ── 2. Migrar avatares de usuarios ─────────────────────────
  console.log("── Migrando avatares de usuarios ──\n");

  const users = await usersModel.findAll({
    where: { avatar: { [Op.ne]: null } },
    order: [["id_user", "ASC"]],
  });

  let migratedAvatars = 0;
  let skippedAvatars = 0;
  let failedAvatars = 0;

  for (const user of users) {
    if (!user.avatar) {
      skippedAvatars++;
      continue;
    }

    if (user.avatar.startsWith("http")) {
      console.log(`  [SKIP] #${user.id_user} ya está en la nube`);
      skippedAvatars++;
      continue;
    }

    if (!user.avatar.startsWith("data:")) {
      console.log(`  [SKIP] #${user.id_user} formato no soportado (no es base64 ni URL)`);
      skippedAvatars++;
      continue;
    }

    try {
      const base64Data = user.avatar.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const result = await uploadBuffer(buffer, {
        public_id: `avatar_${user.id_user}`,
        resource_type: "image",
      });

      await user.update({ avatar: result.secure_url });
      console.log(`  [OK]   #${user.id_user} → ${result.secure_url}`);
      migratedAvatars++;
    } catch (err) {
      console.log(`  [FAIL] #${user.id_user} error: ${err.message}`);
      failedAvatars++;
    }
  }

  console.log(`\nResultado avatares: ${migratedAvatars} migrados, ${skippedAvatars} saltados, ${failedAvatars} fallidos\n`);

  // ── 3. Migrar imágenes de destinos ─────────────────────────
  console.log("── Migrando imágenes de destinos ──\n");

  const destinations = await destinationsModel.findAll({
    where: { image_url: { [Op.ne]: null } },
    order: [["id_destination", "ASC"]],
  });

  let migratedDests = 0;
  let skippedDests = 0;
  let failedDests = 0;

  for (const dest of destinations) {
    if (!dest.image_url) {
      skippedDests++;
      continue;
    }

    if (dest.image_url.includes("cloudinary")) {
      console.log(`  [SKIP] #${dest.id_destination} ya está en Cloudinary`);
      skippedDests++;
      continue;
    }

    try {
      const { buffer, contentType } = await downloadFile(dest.image_url);
      const result = await uploadBuffer(buffer, {
        public_id: `destination_${dest.id_destination}`,
        resource_type: "image",
      });

      await dest.update({ image_url: result.secure_url });
      console.log(`  [OK]   #${dest.id_destination} (${dest.name}) → ${result.secure_url}`);
      migratedDests++;
    } catch (err) {
      console.log(`  [FAIL] #${dest.id_destination} (${dest.name}) error: ${err.message}`);
      failedDests++;
    }
  }

  console.log(`\nResultado destinos: ${migratedDests} migrados, ${skippedDests} saltados, ${failedDests} fallidos\n`);

  console.log("=== Migración completada ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
