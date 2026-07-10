import { VehiclesModel } from "../models/vehicles.models.js";
import { getPaginationParams, getPaginationResponse } from "./pagination.js";
import { moveToTrash } from "../utils/trash.helper.js";

export const getAllVehicles = async (req, res) => {
  try {
    if (req.query.all === 'true') {
      const vehicles = await VehiclesModel.findAll({ order: [['id_vehicle', 'ASC']] });
      return res.json({ success: true, data: vehicles });
    }
    const { page, limit, offset } = getPaginationParams(req);
    const { rows, count } = await VehiclesModel.findAndCountAll({
      limit,
      offset,
      order: [['id_vehicle', 'ASC']],
    });
    res.json({
      success: true,
      data: rows,
      pagination: getPaginationResponse(page, limit, count),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando vehículos",
      error: error.message,
    });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await VehiclesModel.findByPk(id);

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehículo no encontrado" });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando vehículo",
      error: error.message,
    });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const vehicle = await VehiclesModel.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando vehículo",
      error: error.message,
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await VehiclesModel.update(req.body, {
      where: { id_vehicle: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Vehículo no encontrado" });
    }

    const updatedVehicle = await VehiclesModel.findByPk(id);
    res.json({ success: true, data: updatedVehicle });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando vehículo",
      error: error.message,
    });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await moveToTrash(VehiclesModel, id, req.user?.id_user);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Vehículo no encontrado" });
    }

    res.json({ success: true, message: "Vehículo movido a la papelera" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando vehículo",
      error: error.message,
    });
  }
};
