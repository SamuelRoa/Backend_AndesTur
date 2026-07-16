import { packagesModel } from "../models/packages.models.js";
import { getPaginationParams, getPaginationResponse } from "./pagination.js";
import { moveToTrash } from "../utils/trash.helper.js";
import { deleteCachePattern } from "../config/redis.js";

export const getAllPackages = async (req, res) => {
  try {
    if (req.query.all === 'true') {
      const packages = await packagesModel.findAll({ order: [['id_package', 'ASC']] });
      return res.json({ success: true, data: packages });
    }
    const { page, limit, offset } = getPaginationParams(req);
    const { rows, count } = await packagesModel.findAndCountAll({
      limit,
      offset,
      order: [['id_package', 'ASC']],
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
        message: "Error cargando paquetes",
        error: error.message,
      });
  }
};

export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const packageItem = await packagesModel.findByPk(id);

    if (!packageItem) {
      return res
        .status(404)
        .json({ success: false, message: "Paquete no encontrado" });
    }

    res.json({ success: true, data: packageItem });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error buscando paquete",
        error: error.message,
      });
  }
};

export const createPackage = async (req, res) => {
  try {
    const packageItem = await packagesModel.create(req.body);
    deleteCachePattern("cache:packages:*").catch((err) => {
      console.error("Error al invalidar caché tras crear paquete:", err.message);
    });
    res.status(201).json({ success: true, data: packageItem });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error creando paquete",
        error: error.message,
      });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await packagesModel.update(req.body, {
      where: { id_package: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Paquete no encontrado" });
    }

    const updatedPackage = await packagesModel.findByPk(id);
    deleteCachePattern("cache:packages:*").catch((err) => {
      console.error("Error al invalidar caché tras actualizar paquete:", err.message);
    });
    res.json({ success: true, data: updatedPackage });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error actualizando paquete",
        error: error.message,
      });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await moveToTrash(packagesModel, id, req.user?.id_user);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Paquete no encontrado" });
    }

    deleteCachePattern("cache:packages:*").catch((err) => {
      console.error("Error al invalidar caché tras eliminar paquete:", err.message);
    });
    res.json({ success: true, message: "Paquete movido a la papelera" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error eliminando paquete",
        error: error.message,
      });
  }
};
