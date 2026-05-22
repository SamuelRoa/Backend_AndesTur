import "../models/index.js";
import PDFDocument from "pdfkit";
import { Op } from "sequelize";
import { reservationsModel } from "../models/reservations.models.js";
import { customersModel } from "../models/customers.models.js";
import { packagesModel } from "../models/packages.models.js";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Genera PDF con las reservaciones provistas
const generatePdfBuffer = async (reservations) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {});

  doc.fontSize(18).text("Reporte semanal de reservaciones", { align: "center" });
  doc.moveDown();

  reservations.forEach((r, idx) => {
    doc.fontSize(12).text(`${idx + 1}. Reserva ID: ${r.id_reservation}`);
    doc.text(`   Paquete: ${r.package_name || r.id_package}`);
    doc.text(`   Cliente: ${r.customer_name || r.id_customer}`);
    doc.text(`   Fecha de reserva: ${new Date(r.reservation_date).toLocaleString()}`);
    doc.text(`   Estado pago: ${r.pay_state}`);
    doc.moveDown();
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
  });
};

// Recupera reservaciones de la última semana y enriquece con nombres
const fetchWeeklyReservations = async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const reservations = await reservationsModel.findAll({
    where: {
      reservation_date: {
        [Op.between]: [oneWeekAgo, new Date()],
      },
    },
    include: [
      { model: packagesModel, attributes: ['id_package', 'name'] },
      { model: customersModel, attributes: ['id_customer', 'name'] },
    ],
    order: [["reservation_date", "DESC"]],
  });

  // Enriquecer con datos de paquete y cliente si no están disponibles directamente
  const enriched = [];
  for (const r of reservations) {
    const json = r.toJSON ? r.toJSON() : r;
    const customerName = r.Customer?.name || json.customer_name || null;
    const packageName = r.Package?.name || json.package_name || null;

    enriched.push({
      ...json,
      customer_name: customerName,
      package_name: packageName,
    });
  }

  return enriched.filter((x) => new Date(x.reservation_date) >= oneWeekAgo);
};

const sendMailWithAttachment = async (buffer) => {
  // Configuración flexible similar a recoverPassword
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Falta configuración de correo: EMAIL_USER o EMAIL_PASS no está definida");
    return;
  }

  const transporterConfig = process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      }
    : { service: process.env.EMAIL_SERVICE || "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } };

  const transporter = nodemailer.createTransport(transporterConfig);

  const msg = {
    from: process.env.EMAIL_USER,
    to: process.env.REPORT_TO_EMAIL || process.env.EMAIL_USER,
    subject: `Reporte semanal de reservaciones - ${new Date().toLocaleDateString()}`,
    text: "Adjunto reporte semanal de reservaciones.",
    attachments: [{ filename: `reporte_reservaciones_${Date.now()}.pdf`, content: buffer }],
  };

  try {
    const info = await transporter.sendMail(msg);
    console.log("Reporte enviado:", info.messageId);
  } catch (err) {
    console.error("Error enviando reporte:", err.message);
  }
};

// Job que se puede programar, aquí expuesto para ser llamado desde server
export const runWeeklyReportJob = async () => {
  try {
    const reservations = await fetchWeeklyReservations();
    if (!reservations || reservations.length === 0) {
      console.log("No hay reservaciones en la última semana.");
      return;
    }

    const pdfBuffer = await generatePdfBuffer(reservations);
    await sendMailWithAttachment(pdfBuffer);

    // También guardamos un archivo local para inspección opcional
    const outPath = path.join(__dirname, "..", "tmp", `reporte_${Date.now()}.pdf`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, pdfBuffer);

    console.log("Reporte generado y guardado en:", outPath);
  } catch (error) {
    console.error("Error generando reporte semanal:", error.message);
  }
};

// Ejecutar manualmente si se llama como script
if (process.argv[1] && path.basename(process.argv[1]) === "sendWeeklyReport.js") {
  runWeeklyReportJob();
}
