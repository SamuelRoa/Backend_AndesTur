import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Crea y configura el transportador de correo utilizando las variables de entorno.
 * @returns {Object|null} nodemailer transporter o null si faltan configuraciones
 */
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("⚠️ Configuración de correo incompleta: EMAIL_USER o EMAIL_PASS no están definidos.");
    return null;
  }

  const transporterConfig = process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
    : {
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };

  return nodemailer.createTransport(transporterConfig);
};

/**
 * Envía un correo de notificación al administrador informando sobre una nueva pre-reserva.
 * @param {Object} customer - Datos del cliente
 * @param {Object} reservation - Datos de la reservación
 * @param {Object} packageData - Datos del paquete de viaje
 */
export const sendAdminPreReservationEmail = async (customer, reservation, packageData) => {
  const transporter = getTransporter();
  if (!transporter) return;

  const adminEmail = process.env.REPORT_TO_EMAIL || process.env.EMAIL_USER;
  const packageName = packageData ? packageData.name : `Paquete #${reservation.id_package}`;

  const mailOptions = {
    from: `"AndesTur Sitio Web" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `🔔 Nueva Pre-reserva Recibida - AndesTur`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Nueva Pre-reserva Registrada</h2>
        <p>Se ha registrado una nueva pre-reserva desde el sitio web con los siguientes detalles:</p>
        
        <h3 style="color: #2196F3; margin-top: 20px;">Detalles de la Reserva:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Reserva ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${reservation.id_reservation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Paquete:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${packageName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha de Solicitud:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(reservation.reservation_date).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Estado Inicial:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><span style="background-color: #ffeb3b; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 14px;">Pendiente</span></td>
          </tr>
        </table>
        
        <h3 style="color: #2196F3; margin-top: 20px;">Detalles del Cliente:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">DNI:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${customer.dni}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Nombre Completo:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${customer.name} ${customer.lastname || ""}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${customer.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Teléfono:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${customer.phone_number || "No proporcionado"}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <p style="font-size: 14px; color: #666;">Por favor, ingresa al panel administrativo de AndesTur para procesar y validar esta reservación.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email de pre-reserva enviado al administrador: ${adminEmail} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar email de pre-reserva al administrador:", error);
    throw error;
  }
};

/**
 * Envía un correo de notificación al cliente confirmando la validación/aprobación de su reserva.
 * @param {Object} customer - Datos del cliente
 * @param {Object} reservation - Datos de la reservación
 * @param {Object} packageData - Datos del paquete de viaje
 */
export const sendCustomerValidationEmail = async (customer, reservation, packageData) => {
  const transporter = getTransporter();
  if (!transporter) return;

  const packageName = packageData ? packageData.name : `Paquete #${reservation.id_package}`;
  const priceFormatted = packageData ? Number(packageData.price).toLocaleString("es-CO", { style: "currency", currency: "COP" }) : "Ver detalles en la web";

  const mailOptions = {
    from: `"AndesTur Viajes" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `🎉 ¡Tu Reserva ha sido Aprobada! - AndesTur`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4CAF50; margin-bottom: 5px;">¡Felicidades, ${customer.name}!</h2>
          <p style="font-size: 16px; color: #666; margin-top: 0;">Tu reservación ha sido procesada y aprobada con éxito.</p>
        </div>
        
        <p>Tu pre-reserva ya ha sido validada por el administrador y tu lugar para este emocionante viaje está totalmente asegurado.</p>
        
        <h3 style="color: #2196F3; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px;">Detalles de tu Reserva:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Reserva ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${reservation.id_reservation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Viaje seleccionado:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: ${packageData ? 'bold' : 'normal'}; color: #2e7d32;">${packageName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha de Salida:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${packageData ? new Date(packageData.departure_date).toLocaleDateString("es-CO", { dateStyle: 'long' }) : 'Ver en web'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha de Retorno:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${packageData ? new Date(packageData.return_date).toLocaleDateString("es-CO", { dateStyle: 'long' }) : 'Ver en web'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Monto total:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #c62828;">${priceFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Estado de la Reserva:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><span style="background-color: #d4edda; color: #155724; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;">Aprobada / Confirmada</span></td>
          </tr>
        </table>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            <strong>¿Qué sigue ahora?</strong> Nuestro equipo o tu guía turístico se pondrá en contacto contigo previo al viaje para coordinar los puntos de partida e indicaciones adicionales.
          </p>
        </div>
        
        <p style="margin-top: 30px;">Si tienes alguna pregunta o requieres asistencia, puedes responder directamente a este correo electrónico.</p>
        <p style="font-weight: bold; color: #4CAF50; margin-top: 20px;">¡Gracias por viajar con AndesTur!</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email de validación enviado al cliente: ${customer.email} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar email de validación al cliente:", error);
    throw error;
  }
};
