import '../models/index.js';
import cron from 'node-cron';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import { reservationsModel } from '../models/reservations.models.js';
import { packagesModel } from '../models/packages.models.js';
import { customersModel } from '../models/customers.models.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const defaultSchedule = process.env.REPORT_CRON || '0 8 * * 1'; // Every Monday at 08:00

export const generateWeeklyReport = async ({recipient} = {}) => {
  // Calcular inicio y fin de semana actual (lunes - domingo)
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7; // days since Monday
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

  // Enviar por correo
  const to = recipient || process.env.REPORT_RECIPIENT || process.env.EMAIL_USER;
  if (!to) {
    throw new Error('No hay destinatario definido para el reporte. Configure REPORT_RECIPIENT o EMAIL_USER en .env');
  }

  // Configurar transporter (similar a recoverPassword)
  const transporterConfig = process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
    : {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };

  const transporter = nodemailer.createTransport(transporterConfig);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Reporte semanal de reservaciones - ${monday.toISOString().slice(0,10)}`,
    text: `Adjunto el reporte semanal de reservaciones (${monday.toISOString().slice(0,10)} - ${sunday.toISOString().slice(0,10)}).`,
    attachments: [
      {
        filename: `reporte_reservaciones_${monday.toISOString().slice(0,10)}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  // Intentar enviar
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
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
      if (result.success) console.log('Reporte semanal enviado:', result.info.response || result.info);
      else console.error('Error enviando reporte semanal:', result.error);
    } catch (error) {
      console.error('Error en tarea weekly report:', error.message);
    }
  }, { scheduled: true });

  task.start();
  return task;
};
