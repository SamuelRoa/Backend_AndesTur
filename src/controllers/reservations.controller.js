import { reservationsModel } from "../models/reservations.models.js";

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
    const [updated] = await reservationsModel.update(req.body, {
      where: { id_reservation: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Reservación no encontrada" });
    }

    const updatedReservation = await reservationsModel.findByPk(id);
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
