import { destinationsModel } from "../models/destinations.models.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getPaginationParams, getPaginationResponse } from "./pagination.js";
import { moveToTrash } from "../utils/trash.helper.js";

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

    if (req.query.all === 'true') {
      const destinations = await destinationsModel.findAll(where ? { where } : { order: [['id_destination', 'ASC']] });
      return res.json({ success: true, data: destinations });
    }

    const { page, limit, offset } = getPaginationParams(req);
    const { rows, count } = await destinationsModel.findAndCountAll({
      where,
      limit,
      offset,
      distinct: true,
      order: [['id_destination', 'ASC']],
    });
    res.json({
      success: true,
      data: rows,
      pagination: getPaginationResponse(page, limit, count),
    });
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
    const result = await moveToTrash(destinationsModel, id, req.user?.id_user);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Destino no encontrado" });
    }

    res.json({ success: true, message: "Destino movido a la papelera" });
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
