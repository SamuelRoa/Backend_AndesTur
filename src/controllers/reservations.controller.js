import { reservationsModel } from "../models/reservations.models.js";
import { customersModel } from "../models/customers.models.js";
import { packagesModel } from "../models/packages.models.js";
import {
  sendAdminPreReservationEmail,
  sendCustomerValidationEmail,
} from "../services/email.service.js";

export const getAllReservations = async (req, res) => {
  try {
    const reservations = await reservationsModel.findAll();
    res.json({ success: true, data: reservations });
  } catch (error) {
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
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
      include: [
        { model: customersModel },
        { model: packagesModel }
      ]
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
      include: [
        { model: customersModel },
        { model: packagesModel }
      ]
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
        updatedReservation.Package
      ).catch((err) => {
        console.error("Error al enviar correo de validación al cliente:", err.message);
      });
    }

    res.json({ success: true, data: updatedReservation });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error actualizando reservación",
        error: error.message,
      });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await reservationsModel.destroy({
      where: { id_reservation: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Reservación no encontrada" });
    }

    res.json({ success: true, message: "Reservación eliminada" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error eliminando reservación",
        error: error.message,
      });
  }
};

export const queryReservations = async (req, res) => {
  try {
    const { email, dni } = req.body;

    const customer = await customersModel.findOne({
      where: { email, dni }
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
          attributes: ["name", "departure_date", "return_date", "price", "description"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const data = reservations.map((r) => ({
      id_reservation: r.id_reservation,
      pay_state: r.pay_state,
      id_package: r.id_package,
      package: r.Package
        ? {
            name: r.Package.name,
            departure_date: r.Package.departure_date,
            return_date: r.Package.return_date,
            price: r.Package.price,
            description: r.Package.description,
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
    const { dni, name, lastname, phone_number, email, id_package } = req.body;

    // 1. Verificar si el paquete existe
    const packageData = await packagesModel.findByPk(id_package);
    if (!packageData) {
      return res
        .status(404)
        .json({ success: false, message: "El paquete de viaje seleccionado no existe" });
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
    const reservation = await reservationsModel.create({
      id_package,
      id_customer: customer.id_customer,
      pay_state: "pending",
      reservation_date: new Date(),
    });

    // 4. Enviar notificación por correo al administrador asíncronamente
    sendAdminPreReservationEmail(customer, reservation, packageData).catch((err) => {
      console.error("Error al enviar correo de pre-reserva al administrador:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Pre-reserva registrada con éxito",
      data: {
        reservation,
        customer,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error procesando la pre-reserva",
      error: error.message,
    });
  }
};
