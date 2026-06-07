import { sendGenericEmail } from './emailjs.service.js';

const HEAD = `
<div style="background: #1B4332; padding: 30px; text-align: center;">
  <h1 style="color: #C9954B; margin: 0; font-size: 28px; font-family: Georgia, 'Times New Roman', serif;">AndesTur</h1>
</div>`;

const FOOTER = `
<div style="background: #1B4332; padding: 15px; text-align: center;">
  <p style="color: #F5EDE0; margin: 0; font-size: 12px; font-family: Georgia, 'Times New Roman', serif;">AndesTur — Agencia de Viajes</p>
</div>`;

const wrapper = (content) => `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #FAFAF7; border: 1px solid #E8D5B7; border-radius: 8px; overflow: hidden;">
  ${HEAD}
  <div style="padding: 30px;">${content}</div>
  ${FOOTER}
</div>`;

export const sendAdminPreReservationEmail = async (customer, reservation, packageData) => {
  const adminEmail = process.env.REPORT_TO_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) {
    console.error('No hay destinatario admin configurado (REPORT_TO_EMAIL o EMAIL_USER)');
    return;
  }

  const packageName = packageData?.name || `Paquete #${reservation.id_package}`;

  const content = `
    <h2 style="color: #1B4332; border-bottom: 2px solid #C9954B; padding-bottom: 10px;">Nueva Pre-reserva Registrada</h2>
    <p style="color: #2D2D2D;">Se ha registrado una nueva pre-reserva con los siguientes detalles:</p>
    <h3 style="color: #C9954B; margin-top: 20px;">Cliente</h3>
    <table style="width: 100%; border-collapse: collapse; color: #2D2D2D;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; width: 40%; font-weight: bold;">Nombre:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${customer.name} ${customer.lastname || ''}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${customer.email}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Teléfono:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${customer.phone_number || 'No proporcionado'}</td></tr>
    </table>
    <h3 style="color: #C9954B; margin-top: 20px;">Reserva</h3>
    <table style="width: 100%; border-collapse: collapse; color: #2D2D2D;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; width: 40%; font-weight: bold;">Reserva ID:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${reservation.id_reservation}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Paquete:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${packageName}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Fecha:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${new Date(reservation.reservation_date).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td></tr>
    </table>
    <div style="background: #F5EDE0; padding: 15px; border-left: 4px solid #C9954B; margin-top: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #2D2D2D; font-size: 14px;">Ingresa al panel administrativo para procesar esta reservación.</p>
    </div>`;

  try {
    await sendGenericEmail({
      to_email: adminEmail,
      subject: 'Nueva Pre-reserva Recibida - AndesTur',
      html_content: wrapper(content),
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    console.error('Error al enviar correo de pre-reserva al administrador:', errMsg);
    console.error('EmailJS env (no secrets):', {
      SERVICE_ID: process.env.EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICEID || null,
      TEMPLATE_ADMIN_PRERESERVA: process.env.EMAILJS_TEMPLATE_ADMIN_PRERESERVA || process.env.EMAILJS_TEMPLATE_GENERIC || null,
    });
    throw error;
  }
};

export const sendCustomerValidationEmail = async (customer, reservation, packageData) => {
  const packageName = packageData?.name || `Paquete #${reservation.id_package}`;
  const priceFormatted = packageData
    ? Number(packageData.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
    : 'Ver detalles en la web';
  const departureDate = packageData?.departure_date
    ? new Date(packageData.departure_date).toLocaleDateString('es-CO', { dateStyle: 'long' })
    : '';
  const returnDate = packageData?.return_date
    ? new Date(packageData.return_date).toLocaleDateString('es-CO', { dateStyle: 'long' })
    : '';

  const content = `
    <h2 style="color: #1B4332;">¡Felicidades, ${customer.name}!</h2>
    <p style="color: #2D6A4F; font-size: 16px;">Tu reservación ha sido procesada y aprobada con éxito.</p>
    <p style="color: #2D2D2D;">Tu lugar para este viaje está totalmente asegurado.</p>
    <h3 style="color: #C9954B; border-bottom: 2px solid #C9954B; padding-bottom: 10px; margin-top: 25px;">Detalles de tu Reserva</h3>
    <table style="width: 100%; border-collapse: collapse; color: #2D2D2D;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; width: 40%; font-weight: bold;">Reserva ID:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${reservation.id_reservation}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Paquete:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; color: #2D6A4F; font-weight: bold;">${packageName}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Salida:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${departureDate}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Retorno:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${returnDate}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Total:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold; color: #C9954B;">${priceFormatted}</td></tr>
    </table>
    <div style="background: #F5EDE0; padding: 15px; border-left: 4px solid #C9954B; margin-top: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #2D2D2D; font-size: 14px;"><strong>¿Qué sigue?</strong> Nuestro equipo se pondrá en contacto contigo previo al viaje para coordinar los detalles.</p>
    </div>
    <p style="margin-top: 25px; font-weight: bold; color: #1B4332;">¡Gracias por viajar con AndesTur!</p>`;

  try {
    await sendGenericEmail({
      to_email: customer.email,
      subject: '¡Tu Reserva ha sido Aprobada! - AndesTur',
      html_content: wrapper(content),
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    console.error('Error al enviar correo de validación al cliente:', errMsg);
    throw error;
  }
};

export const sendRejectionEmail = async (customer, reservation, packageData, reason) => {
  const packageName = packageData?.name || `Paquete #${reservation.id_package}`;

  const content = `
    <h2 style="color: #9B2226;">Hola ${customer.name},</h2>
    <p style="color: #2D2D2D;">Lamentamos informarte que tu reservación no pudo ser procesada.</p>
    <h3 style="color: #9B2226; border-bottom: 2px solid #9B2226; padding-bottom: 10px; margin-top: 25px;">Detalles</h3>
    <table style="width: 100%; border-collapse: collapse; color: #2D2D2D;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; width: 40%; font-weight: bold;">Reserva ID:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${reservation.id_reservation}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Paquete:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${packageName}</td></tr>
    </table>
    <div style="background: #FFF5F5; padding: 15px; border-left: 4px solid #9B2226; margin-top: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #9B2226; font-size: 14px;"><strong>Motivo:</strong> ${reason || 'No se especificó un motivo.'}</p>
    </div>
    <p style="color: #2D2D2D; margin-top: 20px;">Si tienes alguna duda, puedes contactarnos respondiendo a este correo.</p>
    <p style="font-weight: bold; color: #1B4332; margin-top: 20px;">Gracias por tu interés en AndesTur.</p>`;

  try {
    await sendGenericEmail({
      to_email: customer.email,
      subject: 'Reserva No Procesada - AndesTur',
      html_content: wrapper(content),
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    console.error('Error al enviar correo de rechazo al cliente:', errMsg);
    throw error;
  }
};

export const sendWeeklyReportEmail = async ({ to_email, week_range, total_reservations }) => {
  const content = `
    <div style="text-align: center;">
      <h2 style="color: #1B4332;">Reporte Semanal</h2>
      <p style="color: #2D2D2D;">Periodo: <strong>${week_range}</strong></p>
      <div style="background: #F5EDE0; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px solid #C9954B; display: inline-block; min-width: 200px;">
        <p style="font-size: 14px; color: #2D2D2D; margin: 0;">Total de reservaciones</p>
        <p style="font-size: 48px; color: #1B4332; margin: 10px 0; font-weight: bold;">${total_reservations}</p>
      </div>
      <p style="color: #2D2D2D; font-size: 14px;">El PDF del reporte detallado se ha guardado en el servidor.</p>
    </div>`;

  try {
    await sendGenericEmail({
      to_email,
      subject: `Reporte semanal de reservaciones - ${week_range}`,
      html_content: wrapper(content),
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    console.error('Error al enviar reporte semanal:', errMsg);
    throw error;
  }
};
