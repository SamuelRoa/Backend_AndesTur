import { reservationsModel } from "../models/reservations.models.js";
import { customersModel } from "../models/customers.models.js";
import { packagesModel } from "../models/packages.models.js";
import { destinationsModel } from "../models/destinations.models.js";
import { PackagesDestinationsModel } from "../models/packages_destinations.models.js";
import { PaymentHeaderModel } from "../models/payment_header.models.js";
import { PaymentDetailModel } from "../models/payment_detail.models.js";
import { moveToTrash } from "../utils/trash.helper.js";
import {
  sendAdminPreReservationEmail,
  sendCustomerValidationEmail,
  sendRejectionEmail,
  sendPaymentConfirmationEmail,
} from "../services/email.service.js";
import { simulatePayment } from "../services/paymentSimulator.service.js";
import { getPaginationParams, getPaginationResponse } from "./pagination.js";

function mapPayMethod(paymentMethod) {
  switch (paymentMethod) {
    case "card": return "card";
    case "zelle": return "zelle";
    case "pago_movil": return "pago_movil";
    case "transfer": return "digital_transfer";
    case "paypal": return "paypal";
    default: return "digital_transfer";
  }
}

export const getAllReservations = async (req, res) => {
  try {
    const { pay_state, id_destination } = req.query;

    if (req.query.all === 'true') {
      const reservations = await reservationsModel.findAll({ order: [['id_reservation', 'DESC']] });
      return res.json({ success: true, data: reservations });
    }

    const { page, limit, offset } = getPaginationParams(req);

    const where = {};
    if (pay_state) where.pay_state = pay_state;

    const include = [];

    if (id_destination) {
      include.push({
        model: packagesModel,
        required: true,
        attributes: [],
        include: [{
          model: PackagesDestinationsModel,
          where: { id_destination: Number(id_destination) },
          required: true,
          attributes: [],
        }],
      });
    }

    const { rows, count } = await reservationsModel.findAndCountAll({
      where,
      include: include.length > 0 ? include : undefined,
      limit,
      offset,
      distinct: true,
      order: [['id_reservation', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: getPaginationResponse(page, limit, count),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando reservaciones",
      error: error.message,
    });
  }
};

export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await reservationsModel.findByPk(id);

    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservación no encontrada" });
    }

    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando reservación",
      error: error.message,
    });
  }
};

export const createReservation = async (req, res) => {
  try {
    const reservation = await reservationsModel.create(req.body);
    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando reservación",
      error: error.message,
    });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la reserva actual incluyendo cliente y paquete antes de actualizar
    const reservationBefore = await reservationsModel.findByPk(id, {
      include: [{ model: customersModel }, { model: packagesModel }],
    });

    if (!reservationBefore) {
      return res
        .status(404)
        .json({ success: false, message: "Reservación no encontrada" });
    }

    const [updated] = await reservationsModel.update(req.body, {
      where: { id_reservation: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Reservación no encontrada" });
    }

    // Cargar la reserva actualizada con sus asociaciones
    const updatedReservation = await reservationsModel.findByPk(id, {
      include: [{ model: customersModel }, { model: packagesModel }],
    });

    // Enviar correo si el estado cambia a 'paid'
    if (
      req.body.pay_state === "paid" &&
      reservationBefore.pay_state !== "paid" &&
      updatedReservation.Customer &&
      updatedReservation.Customer.email
    ) {
      sendCustomerValidationEmail(
        updatedReservation.Customer,
        updatedReservation,
        updatedReservation.Package,
      ).catch((err) => {
        console.error(
          "Error al enviar correo de validación al cliente:",
          err.message,
        );
      });
    }

    res.json({ success: true, data: updatedReservation });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando reservación",
      error: error.message,
    });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await moveToTrash(reservationsModel, id, req.user?.id_user);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Reservación no encontrada" });
    }

    res.json({ success: true, message: "Reservación movida a la papelera" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando reservación",
      error: error.message,
    });
  }
};

export const rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await reservationsModel.findByPk(id, {
      include: [{ model: customersModel }, { model: packagesModel }],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservación no encontrada",
      });
    }

    if (reservation.pay_state !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden rechazar reservaciones en estado pendiente",
      });
    }

    reservation.pay_state = "rejected";
    await reservation.save();

    if (reservation.Customer?.email) {
      sendRejectionEmail(
        reservation.Customer,
        reservation,
        reservation.Package,
        reason,
      ).catch((err) => {
        console.error("Error al enviar correo de rechazo:", err.message);
      });
    }

    res.json({
      success: true,
      message: "Reservación rechazada exitosamente",
      data: reservation,
    });
  } catch (error) {
    console.error("Error al rechazar reservación:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al rechazar reservación",
      error: error.message,
    });
  }
};

export const queryReservations = async (req, res) => {
  try {
    const { email, dni } = req.body;

    const customer = await customersModel.findOne({
      where: { email, dni },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron reservaciones con esos datos",
      });
    }

    const reservations = await reservationsModel.findAll({
      where: { id_customer: customer.id_customer },
      include: [
        {
          model: packagesModel,
          attributes: [
            "name",
            "departure_date",
            "return_date",
            "price",
            "description",
          ],
        },
        {
          model: destinationsModel,
          attributes: [
            "id_destination",
            "name",
            "description",
            "price",
            "image_url",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const data = reservations.map((r) => ({
      id_reservation: r.id_reservation,
      pay_state: r.pay_state,
      id_package: r.id_package,
      id_destination: r.id_destination,
      package: r.Package
        ? {
            name: r.Package.name,
            departure_date: r.Package.departure_date,
            return_date: r.Package.return_date,
            price: r.Package.price,
            description: r.Package.description,
          }
        : null,
      destination: r.Destination
        ? {
            id_destination: r.Destination.id_destination,
            name: r.Destination.name,
            description: r.Destination.description,
            price: r.Destination.price,
            image_url: r.Destination.image_url,
          }
        : null,
      reservation_date: r.reservation_date,
      created_at: r.created_at,
      customer: {
        dni: customer.dni,
        name: customer.name,
        lastname: customer.lastname,
        email: customer.email,
        phone_number: customer.phone_number,
      },
    }));

    res.json({
      success: true,
      data: { reservations: data },
    });
  } catch (error) {
    console.error("Error al consultar reservaciones:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al consultar reservaciones",
      error: error.message,
    });
  }
};

export const createPreReservation = async (req, res) => {
  try {
    const { dni, name, lastname, phone_number, email, id_package, id_destination } = req.body;

    let packageData = null;
    let destinationData = null;

    if (id_package) {
      // 1a. Verificar si el paquete existe
      packageData = await packagesModel.findByPk(id_package);
      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: "El paquete de viaje seleccionado no existe",
        });
      }
    } else if (id_destination) {
      // 1b. Verificar si el destino existe
      destinationData = await destinationsModel.findByPk(id_destination);
      if (!destinationData) {
        return res.status(404).json({
          success: false,
          message: "El destino seleccionado no existe",
        });
      }
    }

    // 2. Buscar o crear/actualizar el cliente por DNI
    let customer = await customersModel.findOne({ where: { dni } });
    if (customer) {
      // Actualizar datos del cliente
      await customer.update({ name, lastname, phone_number, email });
    } else {
      try {
        customer = await customersModel.create({
          dni,
          name,
          lastname,
          phone_number,
          email,
        });
      } catch (createErr) {
        // Si falla por unique constraint (email duplicado), buscar por email y actualizar
        if (createErr.name === "SequelizeUniqueConstraintError") {
          customer = await customersModel.findOne({ where: { email } });
          if (customer) {
            await customer.update({ dni, name, lastname, phone_number });
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }

    // 3. Crear la reserva en estado 'pending'
    const reservationData = { id_customer: customer.id_customer, pay_state: "pending", reservation_date: new Date() };
    if (id_package) reservationData.id_package = id_package;
    if (id_destination) reservationData.id_destination = id_destination;
    const reservation = await reservationsModel.create(reservationData);

    // 4. Enviar notificación por correo al administrador asíncronamente
    const entityData = packageData || destinationData;
    sendAdminPreReservationEmail(customer, reservation, entityData).catch(
      (err) => {
        let errDetail;
        try {
          errDetail = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
        } catch (_) {
          try {
            errDetail = JSON.stringify(err);
          } catch (__) {
            errDetail = String(err);
          }
        }
        console.error(
          "Error al enviar correo de pre-reserva al administrador:",
          errDetail,
        );
      },
    );

    res.status(201).json({
      success: true,
      message: "Pre-reserva registrada con éxito",
      data: {
        reservation,
        customer,
        destination: destinationData || undefined,
      },
    });
  } catch (error) {
    const errMsg = (error && error.message) || String(error);
    res.status(500).json({
      success: false,
      message: "Error procesando la pre-reserva",
      error: errMsg,
    });
  }
};

const VALID_PAYMENT_METHODS = ["card", "zelle", "pago_movil", "transfer", "paypal"];

const AGENCY_BANK_INFO = {
  bank: "Banesco Banco Universal",
  accountType: "Cuenta Corriente",
  accountNumber: "0134-0123-45-1234567890",
  holderName: "AndesTur C.A.",
  holderId: "J-12345678-9",
  phoneNumber: "+58 424-7699792",
  pagoMovil: {
    phone: "0412-7699792",
    bank: "Banesco",
    id: "V-12345678",
  },
};

export const payAfterPreReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const receiptFile = req.file || null;

    // Log everything for debugging
    console.log("=== PAY AFTER PRE-RESERVATION ===");
    console.log("Params:", { id });
    console.log("Body:", JSON.stringify(body));
    console.log("File:", receiptFile ? { originalname: receiptFile.originalname, mimetype: receiptFile.mimetype, size: receiptFile.size } : "none");

    const {
      payment_method,
      cardNumber,
      expiry,
      cvv,
      zelleIdentifier,
      transferReference,
      bankName,
    } = body;

    // --- Validation ---
    if (!payment_method) {
      return res.status(400).json({
        success: false,
        message: "El método de pago es requerido",
        errors: [{ field: "payment_method", message: "Selecciona un método de pago" }],
      });
    }

    if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `Método de pago inválido: "${payment_method}". Use: card, zelle, pago_movil o transfer`,
        errors: [{ field: "payment_method", message: `"${payment_method}" no es válido` }],
      });
    }

    // --- Find reservation ---
    const reservation = await reservationsModel.findByPk(id, {
      include: [
        { model: customersModel },
        { model: packagesModel },
        { model: destinationsModel },
      ],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    if (reservation.pay_state === "paid") {
      return res.status(400).json({
        success: false,
        message: "Esta reserva ya está pagada",
      });
    }

    if (["cancelled", "expired", "rejected"].includes(reservation.pay_state)) {
      return res.status(400).json({
        success: false,
        message: "Esta reserva ya no está disponible para pago",
      });
    }

    const packageData = reservation.Package;
    const destinationData = reservation.Destination;
    const customer = reservation.Customer;
    const amount = Number(packageData?.price || destinationData?.price || 0);

    // --- Pago Móvil: special handling ---
    if (payment_method === "pago_movil") {
      const receiptRef = body.receiptReference || `PM-${Date.now()}`;

      await PaymentHeaderModel.create({
        id_reservation: reservation.id_reservation,
        total_amount: amount,
        payment_date: new Date(),
      });

      // Store as pending admin verification
      await reservation.update({ pay_state: "pending" });

      return res.json({
        success: true,
        message: "Solicitud de pago recibida. Debes esperar la confirmación de la agencia.",
        data: {
          payment: {
            status: "pending_verification",
            reference: receiptRef,
          },
          reservation: {
            id_reservation: reservation.id_reservation,
            pay_state: "pending",
          },
          bankInfo: AGENCY_BANK_INFO,
        },
      });
    }

    // --- Card, Zelle, Transfer: simulated payment ---
    const simulation = simulatePayment({
      payment_method,
      amount,
      cardNumber,
      expiry,
      cvv,
      zelleIdentifier,
      transferReference,
      bankName,
    });

    const header = await PaymentHeaderModel.create({
      id_reservation: reservation.id_reservation,
      total_amount: amount,
      payment_date: new Date(),
    });

    await PaymentDetailModel.create({
      id_payment_header: header.id_payment_header,
      pay_method: mapPayMethod(payment_method),
      amount_paid: amount,
      reference: simulation.reference,
      payment_date: new Date(),
    });

    if (simulation.approved) {
      await reservation.update({ pay_state: "paid" });

      if (customer?.email) {
        sendPaymentConfirmationEmail(
          customer,
          reservation,
          packageData,
          header,
          simulation,
        ).catch((err) => {
          console.error("Error al enviar factura de pago:", err.message);
        });
      }
    } else {
      await reservation.update({ pay_state: "rejected" });
    }

    res.json({
      success: true,
      message: simulation.message,
      data: {
        payment: {
          id_payment_header: header.id_payment_header,
          id_reservation: reservation.id_reservation,
          amount,
          payment_method,
          status: simulation.status,
          reference: simulation.reference,
          cardBrand: simulation.cardBrand || null,
          lastFour: simulation.lastFour || null,
        },
        reservation: {
          id_reservation: reservation.id_reservation,
          pay_state: simulation.approved ? "paid" : "rejected",
        },
      },
    });
  } catch (error) {
    console.error("Error procesando pago post-reserva:", error);
    res.status(500).json({
      success: false,
      message: "Error procesando el pago",
      error: error.message,
    });
  }
};
