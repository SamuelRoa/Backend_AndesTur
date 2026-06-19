import { destinationsModel } from "../models/destinations.models.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export const getAllDestinations = async (req, res) => {
  try {
    const { active } = req.query;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const isAdminRequest = authHeader && verifyToken(authHeader.replace(/^(Bearer|bearer)\s+/, "")).success;

    const where =
      active === "true"
        ? { activo: true }
        : !isAdminRequest
        ? { activo: true }
        : undefined;

    const destinations = await destinationsModel.findAll(where ? { where } : {});
    res.json({ success: true, data: destinations });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error cargando destinos",
        error: error.message,
      });
  }
};

export const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await destinationsModel.findByPk(id);

    if (!destination) {
      return res
        .status(404)
        .json({ success: false, message: "Destino no encontrado" });
    }

    res.json({ success: true, data: destination });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error buscando destino",
        error: error.message,
      });
  }
};

export const createDestination = async (req, res) => {
  try {
    const destination = await destinationsModel.create(req.body);
    res.status(201).json({ success: true, data: destination });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error creando destino",
        error: error.message,
      });
  }
};

export const updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await destinationsModel.update(req.body, {
      where: { id_destination: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Destino no encontrado" });
    }

    const updatedDestination = await destinationsModel.findByPk(id);
    res.json({ success: true, data: updatedDestination });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error actualizando destino",
        error: error.message,
      });
  }
};

export const deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await destinationsModel.destroy({
      where: { id_destination: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Destino no encontrado" });
    }

    res.json({ success: true, message: "Destino eliminado" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error eliminando destino",
        error: error.message,
      });
  }
};
