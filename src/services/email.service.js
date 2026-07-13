import { sendGenericEmail } from "./emailjs.service.js";

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

export const sendAdminPreReservationEmail = async (
  customer,
  reservation,
  packageData,
) => {
  const adminEmail = process.env.REPORT_TO_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) {
    console.error(
      "No hay destinatario admin configurado (REPORT_TO_EMAIL o EMAIL_USER)",
    );
    return;
  }

  const packageName = packageData?.name || `Paquete #${reservation.id_package}`;

  const content = `
    <h2 style="color: #1B4332; border-bottom: 2px solid #C9954B; padding-bottom: 10px;">Nueva Pre-reserva Registrada</h2>
    <p style="color: #2D2D2D;">Se ha registrado una nueva pre-reserva con los siguientes detalles:</p>
    <h3 style="color: #C9954B; margin-top: 20px;">Cliente</h3>
    <table style="width: 100%; border-collapse: collapse; color: #2D2D2D;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; width: 40%; font-weight: bold;">Nombre:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${customer.name} ${customer.lastname || ""}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${customer.email}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Teléfono:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${customer.phone_number || "No proporcionado"}</td></tr>
    </table>
    <h3 style="color: #C9954B; margin-top: 20px;">Reserva</h3>
    <table style="width: 100%; border-collapse: collapse; color: #2D2D2D;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; width: 40%; font-weight: bold;">Reserva ID:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${reservation.id_reservation}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Paquete:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${packageName}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #E8D5B7; font-weight: bold;">Fecha:</td><td style="padding: 8px; border-bottom: 1px solid #E8D5B7;">${new Date(reservation.reservation_date).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</td></tr>
    </table>
    <div style="background: #F5EDE0; padding: 15px; border-left: 4px solid #C9954B; margin-top: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #2D2D2D; font-size: 14px;">Ingresa al panel administrativo para procesar esta reservación.</p>
    </div>`;

  try {
    await sendGenericEmail({
      to_email: adminEmail,
      subject: "Nueva Pre-reserva Recibida - AndesTur",
      html_content: wrapper(content),
    });
  } catch (error) {
    let errDetail;
    try {
      errDetail = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch (_) {
      try {
        errDetail = JSON.stringify(error);
      } catch (__) {
        errDetail = String(error);
      }
    }
    console.error(
      "Error al enviar correo de pre-reserva al administrador:",
      errDetail,
    );
    console.error("EmailJS env (no secrets):", {
      SERVICE_ID:
        process.env.EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICEID || null,
      TEMPLATE_ADMIN_PRERESERVA:
        process.env.EMAILJS_TEMPLATE_ADMIN_PRERESERVA ||
        process.env.EMAILJS_TEMPLATE_GENERIC ||
        null,
    });
    throw error;
    console.error(
      "Error al enviar correo de pre-reserva al administrador:",
      errMsg,
    );
    console.error("EmailJS env (no secrets):", {
      SERVICE_ID:
        process.env.EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICEID || null,
      TEMPLATE_ADMIN_PRERESERVA:
        process.env.EMAILJS_TEMPLATE_ADMIN_PRERESERVA ||
        process.env.EMAILJS_TEMPLATE_GENERIC ||
        null,
    });
    throw error;
  }
};

export const sendCustomerValidationEmail = async (
  customer,
  reservation,
  packageData,
) => {
  const packageName = packageData?.name || `Paquete #${reservation.id_package}`;
  const priceFormatted = packageData
    ? Number(packageData.price).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
      })
    : "Ver detalles en la web";
  const departureDate = packageData?.departure_date
    ? new Date(packageData.departure_date).toLocaleDateString("es-CO", {
        dateStyle: "long",
      })
    : "";
  const returnDate = packageData?.return_date
    ? new Date(packageData.return_date).toLocaleDateString("es-CO", {
        dateStyle: "long",
      })
    : "";

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
      subject: "¡Tu Reserva ha sido Aprobada! - AndesTur",
      html_content: wrapper(content),
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    console.error("Error al enviar correo de validación al cliente:", errMsg);
    throw error;
  }
};

export const sendRejectionEmail = async (
  customer,
  reservation,
  packageData,
  reason,
) => {
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
      <p style="margin: 0; color: #9B2226; font-size: 14px;"><strong>Motivo:</strong> ${reason || "No se especificó un motivo."}</p>
    </div>
    <p style="color: #2D2D2D; margin-top: 20px;">Si tienes alguna duda, puedes contactarnos respondiendo a este correo.</p>
    <p style="font-weight: bold; color: #1B4332; margin-top: 20px;">Gracias por tu interés en AndesTur.</p>`;

  try {
    await sendGenericEmail({
      to_email: customer.email,
      subject: "Reserva No Procesada - AndesTur",
      html_content: wrapper(content),
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    console.error("Error al enviar correo de rechazo al cliente:", errMsg);
    throw error;
  }
};

const PAYMENT_METHOD_LABELS = {
  card: "Tarjeta de Crédito/Débito",
  zelle: "Zelle",
  pago_movil: "Pago Móvil",
  transfer: "Transferencia Bancaria",
  digital_transfer: "Transferencia Bancaria",
};

const CURRENCY_SYMBOL = "USD";
const COMPANY_INFO = {
  name: "AndesTur",
  rif: "J-12345678-9",
  address: "Mérida, Estado Mérida, Venezuela",
  phone: "+58 424-7699792",
  email: "contacto@andestur.com",
};

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateLong(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTimeLong(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const generateInvoiceHTML = (customer, reservation, packageData, paymentHeader, simulation) => {
  const invoiceNumber = `FAC-${String(reservation.id_reservation).padStart(6, "0")}-${String(paymentHeader.id_payment_header).padStart(4, "0")}`;
  const methodLabel = PAYMENT_METHOD_LABELS[simulation.payment_method] || simulation.payment_method;
  const subtotal = Number(packageData?.price || 0);
  const taxRate = 0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return `
<div style="background: #FAFAF7; padding: 20px; font-family: 'Courier New', Courier, monospace;">
  <div style="max-width: 650px; margin: 0 auto; background: white; border: 2px solid #1B4332; border-radius: 8px; overflow: hidden;">

    <!-- HEADER: Invoice -->
    <div style="background: #1B4332; padding: 25px; text-align: center; border-bottom: 4px solid #C9954B;">
      <h1 style="color: #C9954B; margin: 0; font-size: 26px; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">ANDESTUR</h1>
      <p style="color: #F5EDE0; margin: 4px 0 0; font-size: 11px; letter-spacing: 1px;">AGENCIA DE VIAJES Y TURISMO</p>
    </div>

    <!-- INVOICE TITLE -->
    <div style="text-align: center; padding: 20px; border-bottom: 2px dashed #E8D5B7;">
      <h2 style="color: #1B4332; margin: 0; font-size: 22px; font-family: Georgia, 'Times New Roman', serif;">FACTURA DE PAGO</h2>
      <p style="color: #999; font-size: 11px; margin: 4px 0 0;">Documento equivalente a factura</p>
    </div>

    <!-- INVOICE INFO -->
    <table style="width: 100%; padding: 20px; border-collapse: collapse; font-size: 12px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <p style="font-weight: bold; color: #1B4332; margin: 0 0 4px; font-size: 13px;">EMISOR</p>
          <p style="margin: 2px 0; color: #333;">${COMPANY_INFO.name}</p>
          <p style="margin: 2px 0; color: #333;">RIF: ${COMPANY_INFO.rif}</p>
          <p style="margin: 2px 0; color: #333;">${COMPANY_INFO.address}</p>
          <p style="margin: 2px 0; color: #333;">${COMPANY_INFO.phone}</p>
          <p style="margin: 2px 0; color: #333;">${COMPANY_INFO.email}</p>
        </td>
        <td style="width: 50%; vertical-align: top; text-align: right;">
          <p style="font-weight: bold; color: #1B4332; margin: 0 0 4px; font-size: 13px;">FACTURA N°</p>
          <p style="margin: 2px 0; color: #1B4332; font-weight: bold; font-size: 15px;">${invoiceNumber}</p>
          <p style="margin: 2px 0; color: #333;">Fecha: ${formatDateTimeLong(paymentHeader.payment_date)}</p>
          <p style="margin: 2px 0; color: #333;">Método de pago: ${methodLabel}</p>
          <p style="margin: 2px 0; color: #333;">Referencia: ${simulation.reference}</p>
          ${simulation.cardBrand ? `<p style="margin: 2px 0; color: #333;">Tarjeta: ${simulation.cardBrand.toUpperCase()} ****${simulation.lastFour}</p>` : ""}
        </td>
      </tr>
    </table>

    <!-- CLIENT INFO -->
    <div style="background: #F5EDE0; padding: 15px 20px; margin: 0 20px 20px; border-left: 4px solid #C9954B; border-radius: 4px;">
      <p style="font-weight: bold; color: #1B4332; margin: 0 0 4px; font-size: 13px;">CLIENTE</p>
      <table style="width: 100%; font-size: 12px; color: #333; border-collapse: collapse;">
        <tr><td style="padding: 2px 0; width: 80px; font-weight: bold;">Nombre:</td><td style="padding: 2px 0;">${customer.name} ${customer.lastname || ""}</td></tr>
        <tr><td style="padding: 2px 0; font-weight: bold;">Email:</td><td style="padding: 2px 0;">${customer.email}</td></tr>
        <tr><td style="padding: 2px 0; font-weight: bold;">DNI:</td><td style="padding: 2px 0;">${customer.dni}</td></tr>
        <tr><td style="padding: 2px 0; font-weight: bold;">Teléfono:</td><td style="padding: 2px 0;">${customer.phone_number || "—"}</td></tr>
      </table>
    </div>

    <!-- TABLE HEADER -->
    <table style="width: calc(100% - 40px); margin: 0 20px; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background: #1B4332; color: white;">
          <th style="padding: 10px; text-align: left; font-weight: normal;">Descripción</th>
          <th style="padding: 10px; text-align: center; font-weight: normal; width: 80px;">Cant.</th>
          <th style="padding: 10px; text-align: right; font-weight: normal; width: 120px;">Precio Unit.</th>
          <th style="padding: 10px; text-align: right; font-weight: normal; width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #E8D5B7;">
          <td style="padding: 12px 10px;">
            <p style="margin: 0; font-weight: bold; color: #1B4332;">${packageData?.name || `Paquete Turístico #${reservation.id_package}`}</p>
            <p style="margin: 4px 0 0; color: #666; font-size: 11px;">
              ${packageData?.departure_date ? `Salida: ${formatDateLong(packageData.departure_date)}` : ""}
              ${packageData?.return_date ? ` → Retorno: ${formatDateLong(packageData.return_date)}` : ""}
            </p>
            ${packageData?.description ? `<p style="margin: 4px 0 0; color: #666; font-size: 11px;">${packageData.description.slice(0, 100)}</p>` : ""}
          </td>
          <td style="padding: 12px 10px; text-align: center;">1</td>
          <td style="padding: 12px 10px; text-align: right;">${formatCurrency(subtotal)}</td>
          <td style="padding: 12px 10px; text-align: right; font-weight: bold;">${formatCurrency(subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- TOTALS -->
    <table style="width: calc(100% - 40px); margin: 10px 20px 20px; border-collapse: collapse; font-size: 12px;">
      <tr>
        <td style="width: 60%;"></td>
        <td style="width: 40%;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px; text-align: right; color: #666;">Subtotal:</td>
              <td style="padding: 6px; text-align: right; width: 100px;">${formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 6px; text-align: right; color: #666;">Exento de IVA:</td>
              <td style="padding: 6px; text-align: right;">${formatCurrency(0)}</td>
            </tr>
            <tr style="border-top: 2px solid #1B4332;">
              <td style="padding: 10px 6px; text-align: right; font-weight: bold; color: #1B4332; font-size: 15px;">TOTAL:</td>
              <td style="padding: 10px 6px; text-align: right; font-weight: bold; color: #C9954B; font-size: 16px;">${formatCurrency(total)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 6px; text-align: right; color: #999; font-size: 10px;" colspan="2">${CURRENCY_SYMBOL} — Dólar Americano</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- PAYMENT STATUS -->
    <div style="text-align: center; padding: 15px; margin: 0 20px 20px; background: #E8F5E9; border: 1px solid #4CAF50; border-radius: 6px;">
      <p style="margin: 0; color: #2E7D32; font-size: 14px; font-weight: bold;">✓ PAGO CONFIRMADO</p>
      <p style="margin: 4px 0 0; color: #2E7D32; font-size: 11px;">Reserva N° ${reservation.id_reservation} — Estado: Pagada</p>
    </div>

    <!-- FOOTER INFO -->
    <div style="padding: 0 20px 20px; text-align: center; font-size: 10px; color: #999;">
      <p style="margin: 2px 0;">Reserva ID: ${reservation.id_reservation} | Factura: ${invoiceNumber}</p>
      <p style="margin: 2px 0;">Gracias por confiar en ${COMPANY_INFO.name}. ¡Buen viaje!</p>
      <p style="margin: 6px 0 0; color: #ccc;">Este es un documento generado automáticamente. No requiere firma.</p>
    </div>

  </div>
</div>`;
};

export const sendPaymentConfirmationEmail = async (
  customer,
  reservation,
  packageData,
  paymentHeader,
  simulation,
) => {
  const packageName = packageData?.name || `Paquete #${reservation.id_package}`;
  const methodLabel = PAYMENT_METHOD_LABELS[simulation.payment_method] || simulation.payment_method;

  const invoiceHTML = generateInvoiceHTML(customer, reservation, packageData, paymentHeader, simulation);

  const content = `
    <h2 style="color: #1B4332;">¡Pago recibido, ${customer.name}!</h2>
    <p style="color: #2D6A4F; font-size: 16px;">Hemos procesado tu pago exitosamente.</p>
    <div style="background: #E8F5E9; border: 1px solid #4CAF50; border-radius: 6px; padding: 15px; margin: 15px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #2E7D32;"><strong>Reserva #${reservation.id_reservation}</strong></p>
      <p style="margin: 4px 0; font-size: 13px; color: #2E7D32;">${packageName}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #C9954B; font-weight: bold;">${methodLabel} — ${simulation.reference}</p>
      <p style="margin: 4px 0; font-size: 12px; color: #2E7D32;">Monto: ${Number(paymentHeader.total_amount).toFixed(2)} USD</p>
    </div>
    <p style="color: #2D2D2D;">A continuación encontrarás tu factura detallada:</p>
    ${invoiceHTML}
    <div style="background: #F5EDE0; padding: 15px; border-left: 4px solid #C9954B; margin-top: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #2D2D2D; font-size: 14px;"><strong>¿Qué sigue?</strong> Te contactaremos antes de la fecha del viaje con todos los detalles. Si tienes dudas, responde a este correo o escríbenos a ${COMPANY_INFO.phone}.</p>
    </div>
    <p style="margin-top: 25px; font-weight: bold; color: #1B4332;">¡Gracias por viajar con AndesTur!</p>`;

  try {
    await sendGenericEmail({
      to_email: customer.email,
      subject: `Factura de Pago — Reserva #${reservation.id_reservation} — AndesTur`,
      html_content: wrapper(content),
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    console.error("Error al enviar factura de pago al cliente:", errMsg);
    throw error;
  }
};

export const sendWeeklyReportEmail = async ({
  to_email,
  week_range,
  total_reservations,
}) => {
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
    console.error("Error al enviar reporte semanal:", errMsg);
    throw error;
  }
};
