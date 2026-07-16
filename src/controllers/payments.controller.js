import { PaymentHeaderModel } from "../models/payment_header.models.js";
import { PaymentDetailModel } from "../models/payment_detail.models.js";
import { reservationsModel } from "../models/reservations.models.js";
import { customersModel } from "../models/customers.models.js";
import { packagesModel } from "../models/packages.models.js";
import { destinationsModel } from "../models/destinations.models.js";
import { simulatePayment } from "../services/paymentSimulator.service.js";
import { sendPaymentConfirmationEmail } from "../services/email.service.js";
import { validateData } from "../middleware/validation.middleware.js";
import { z } from "zod";

const initiatePaymentSchema = z.object({
  id_reservation: z.number().int().positive(),
  amount: z.number().positive(),
  payment_method: z.enum(["card", "zelle", "pago_movil", "transfer", "paypal"]),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  cvv: z.string().optional(),
  zelleIdentifier: z.string().optional(),
  transferReference: z.string().optional(),
  bankName: z.string().optional(),
  phoneNumber: z.string().optional(),
  bankOperator: z.string().optional(),
});

function mapPayMethod(paymentMethod) {
  switch (paymentMethod) {
    case "card":
      return "card";
    case "zelle":
      return "zelle";
    case "pago_movil":
      return "pago_movil";
    case "transfer":
      return "digital_transfer";
    case "paypal":
      return "paypal";
    default:
      return "digital_transfer";
  }
}

export const initiatePayment = async (req, res) => {
  try {
    const validation = validateData(initiatePaymentSchema, req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Datos de pago inválidos",
          errors: validation.errors,
        });
    }

    const reservation = await reservationsModel.findByPk(
      validation.data.id_reservation,
    );
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reserva no encontrada" });
    }

    if (reservation.pay_state === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Esta reserva ya está pagada" });
    }

    if (reservation.pay_state === "cancelled" || reservation.pay_state === "expired") {
      return res
        .status(400)
        .json({ success: false, message: "Esta reserva ya no está disponible para pago" });
    }

    let packageData = null;
    let destinationData = null;
    if (reservation.id_package) {
      packageData = await packagesModel.findByPk(reservation.id_package);
    } else if (reservation.id_destination) {
      destinationData = await destinationsModel.findByPk(reservation.id_destination);
    }
    const customer = await customersModel.findByPk(reservation.id_customer);

    const simulation = simulatePayment({
      ...validation.data,
      amount: validation.data.amount,
    });

    const header = await PaymentHeaderModel.create({
      id_reservation: reservation.id_reservation,
      total_amount: validation.data.amount,
      payment_date: new Date(),
    });

    await PaymentDetailModel.create({
      id_payment_header: header.id_payment_header,
      pay_method: mapPayMethod(validation.data.payment_method),
      amount_paid: validation.data.amount,
      reference: simulation.reference,
      payment_date: new Date(),
    });

    if (simulation.approved) {
      await reservation.update({ pay_state: "paid" });

      // Enviar factura al cliente por email (asíncrono)
      if (customer?.email) {
        sendPaymentConfirmationEmail(
          customer,
          reservation,
          packageData || destinationData,
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
          amount: validation.data.amount,
          payment_method: validation.data.payment_method,
          status: simulation.status,
          reference: simulation.reference,
          cardBrand: simulation.cardBrand || null,
          lastFour: simulation.lastFour || null,
        },
        reservation: {
          id_reservation: reservation.id_reservation,
          pay_state: simulation.approved ? "paid" : "rejected",
        },
        reservationSummary: {
          customer: customer
            ? `${customer.name} ${customer.lastname || ""}`.trim()
            : null,
          package: packageData?.name || null,
          destination: destinationData?.name || null,
          price: packageData?.price || destinationData?.price || null,
        },
      },
    });
  } catch (error) {
    console.error("Error iniciando pago:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error procesando el pago",
        error: error.message,
      });
  }
};

export const registerManualPayment = async (req, res) => {
  try {
    const { id_reservation, pay_method, amount_paid, reference, payment_date } = req.body;

    const reservation = await reservationsModel.findByPk(id_reservation);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reserva no encontrada" });
    }

    const validMethods = ["cash", "card", "zelle", "pago_movil", "digital_transfer"];
    if (!validMethods.includes(pay_method)) {
      return res.status(400).json({ success: false, message: "Método de pago inválido" });
    }

    const header = await PaymentHeaderModel.create({
      id_reservation,
      total_amount: amount_paid,
      payment_date: payment_date || new Date(),
    });

    await PaymentDetailModel.create({
      id_payment_header: header.id_payment_header,
      pay_method,
      amount_paid,
      reference: reference || null,
      payment_date: payment_date || new Date(),
    });

    // Update reservation state
    const updatedState = reservation.pay_state === "partial" ? "partial" : "paid";
    await reservation.update({ pay_state: updatedState });

    // Send confirmation email if paid in full
    if (updatedState === "paid") {
      const customer = await customersModel.findByPk(reservation.id_customer);
      let serviceData = await packagesModel.findByPk(reservation.id_package);
      if (!serviceData && reservation.id_destination) {
        serviceData = await destinationsModel.findByPk(reservation.id_destination);
      }
      if (customer?.email) {
        sendPaymentConfirmationEmail(
          customer,
          reservation,
          serviceData,
          header,
          { reference, payment_method: pay_method, approved: true, status: "approved" },
        ).catch((err) => {
          console.error("Error al enviar factura de pago manual:", err.message);
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Pago registrado manualmente",
      data: { header, reservation },
    });
  } catch (error) {
    console.error("Error registrando pago manual:", error);
    res.status(500).json({
      success: false,
      message: "Error registrando pago manual",
      error: error.message,
    });
  }
};

export const getPaymentsForReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await reservationsModel.findByPk(id);
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reserva no encontrada" });
    }

    const paymentHeaders = await PaymentHeaderModel.findAll({
      where: { id_reservation: id },
      order: [["created_at", "DESC"]],
    });

    if (paymentHeaders.length === 0) {
      return res.json({
        success: true,
        data: { reservation, headers: [], details: [] },
      });
    }

    const detailRows = await PaymentDetailModel.findAll({
      where: {
        id_payment_header: paymentHeaders.map((h) => h.id_payment_header),
      },
    });

    res.json({
      success: true,
      data: { reservation, headers: paymentHeaders, details: detailRows },
    });
  } catch (error) {
    console.error("Error consultando pagos:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error consultando pagos",
        error: error.message,
      });
  }
};
