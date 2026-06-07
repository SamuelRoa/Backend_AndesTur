import "../models/index.js";
import PDFDocument from "pdfkit";
import { Op } from "sequelize";
import { reservationsModel } from "../models/reservations.models.js";
import { customersModel } from "../models/customers.models.js";
import { packagesModel } from "../models/packages.models.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendWeeklyReportEmail } from "../services/email.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const sendNotification = async (weekRange, total, pdfPath) => {
  const to = process.env.REPORT_TO_EMAIL || process.env.EMAIL_USER;
  if (!to) {
    console.error("Falta configuración de correo: REPORT_TO_EMAIL o EMAIL_USER no está definida");
    return;
  }

  try {
    await sendWeeklyReportEmail({
      to_email: to,
      week_range: weekRange,
      total_reservations: String(total),
    });
    console.log("Notificación de reporte enviada a:", to);
    console.log("PDF guardado localmente en:", pdfPath);
  } catch (err) {
    console.error("Error enviando notificación de reporte:", err.message);
  }
};

export const runWeeklyReportJob = async () => {
  try {
    const reservations = await fetchWeeklyReservations();
    if (!reservations || reservations.length === 0) {
      console.log("No hay reservaciones en la última semana.");
      return;
    }

    const pdfBuffer = await generatePdfBuffer(reservations);

    const outDir = path.join(__dirname, "..", "tmp");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `reporte_${Date.now()}.pdf`);
    fs.writeFileSync(outPath, pdfBuffer);

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const weekRange = `${weekAgo.toISOString().slice(0,10)} - ${now.toISOString().slice(0,10)}`;

    await sendNotification(weekRange, reservations.length, outPath);

    console.log("Reporte generado y guardado en:", outPath);
  } catch (error) {
    console.error("Error generando reporte semanal:", error.message);
  }
};

if (process.argv[1] && path.basename(process.argv[1]) === "sendWeeklyReport.js") {
  runWeeklyReportJob();
}
