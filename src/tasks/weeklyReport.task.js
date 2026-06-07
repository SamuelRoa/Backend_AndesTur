import '../models/index.js';
import cron from 'node-cron';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import { reservationsModel } from '../models/reservations.models.js';
import { packagesModel } from '../models/packages.models.js';
import { customersModel } from '../models/customers.models.js';
import { sendWeeklyReportEmail } from '../services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultSchedule = process.env.REPORT_CRON || '0 8 * * 1';

export const generateWeeklyReport = async ({recipient} = {}) => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0,0,0,0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);

  const reservations = await reservationsModel.findAll({
    where: {
      reservation_date: {
        [Op.between]: [monday, sunday],
      },
    },
    include: [
      { model: packagesModel, attributes: ['id_package', 'name'] },
      { model: customersModel, attributes: ['id_customer', 'name'] },
    ],
    order: [['reservation_date', 'ASC']],
  });

  const doc = new PDFDocument({ margin: 40 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const title = `Reporte semanal de reservaciones (${monday.toISOString().slice(0,10)} - ${sunday.toISOString().slice(0,10)})`;
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();

  if (reservations.length === 0) {
    doc.fontSize(12).text('No hay reservaciones para la semana.');
  } else {
    reservations.forEach((r, idx) => {
      const packageName = r.Package?.name || r.id_package;
      const customerName = r.Customer?.name || r.id_customer;

      doc.fontSize(12).text(`${idx + 1}. Reserva ID: ${r.id_reservation}`);
      doc.text(`   Paquete: ${packageName}`);
      doc.text(`   Cliente: ${customerName}`);
      doc.text(`   Fecha de reserva: ${new Date(r.reservation_date).toLocaleString()}`);
      doc.text(`   Estado de pago: ${r.pay_state}`);
      doc.moveDown(0.5);
    });
  }

  doc.end();

  const pdfBuffer = await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const to = recipient || process.env.REPORT_RECIPIENT || process.env.EMAIL_USER;
  if (!to) {
    throw new Error('No hay destinatario definido para el reporte. Configure REPORT_RECIPIENT o EMAIL_USER en .env');
  }

  const weekRange = `${monday.toISOString().slice(0,10)} - ${sunday.toISOString().slice(0,10)}`;

  try {
    await sendWeeklyReportEmail({
      to_email: to,
      week_range: weekRange,
      total_reservations: String(reservations.length),
    });
    return { success: true, weekRange, pdfBuffer };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const startWeeklyReportTask = () => {
  if (process.env.NODE_ENV === 'test') return null;
  const task = cron.schedule(defaultSchedule, async () => {
    try {
      console.log('Ejecutando tarea programada: weekly report');
      const result = await generateWeeklyReport();
      if (result.success) console.log('Reporte semanal enviado');
      else console.error('Error enviando reporte semanal:', result.error);
    } catch (error) {
      console.error('Error en tarea weekly report:', error.message);
    }
  }, { scheduled: true });

  task.start();
  return task;
};
