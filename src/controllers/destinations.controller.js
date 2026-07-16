import { destinationsModel } from "../models/destinations.models.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getPaginationParams, getPaginationResponse } from "./pagination.js";
import { moveToTrash } from "../utils/trash.helper.js";
import { deleteCachePattern } from "../config/redis.js";

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

export const uploadDestinationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se envió ninguna imagen" });
    }
    const { uploadBuffer } = await import("../utils/cloudinary.js");
    const result = await uploadBuffer(req.file.buffer, {
      public_id: `destination_${Date.now()}`,
      resource_type: "image",
    });
    res.json({ success: true, data: { url: result.secure_url } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error subiendo imagen", error: error.message });
  }
};

export const createDestination = async (req, res) => {
  try {
    const destination = await destinationsModel.create(req.body);
    deleteCachePattern("cache:destinations:*").catch((err) => {
      console.error("Error al invalidar caché tras crear destino:", err.message);
    });
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
    deleteCachePattern("cache:destinations:*").catch((err) => {
      console.error("Error al invalidar caché tras actualizar destino:", err.message);
    });
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

    deleteCachePattern("cache:destinations:*").catch((err) => {
      console.error("Error al invalidar caché tras eliminar destino:", err.message);
    });
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
