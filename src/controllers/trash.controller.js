import { trashModel } from "../models/trash.models.js";
import { usersModel } from "../models/users.models.js";
import { customersModel } from "../models/customers.models.js";
import { destinationsModel } from "../models/destinations.models.js";
import { packagesModel } from "../models/packages.models.js";
import { reservationsModel } from "../models/reservations.models.js";
import { staffModel } from "../models/staff.models.js";
import { VehiclesModel } from "../models/vehicles.models.js";
import { getPaginationParams, getPaginationResponse } from "./pagination.js";
import { Op } from "sequelize";
import { deleteCachePattern } from "../config/redis.js";

const MODEL_MAP = {
  customers: customersModel,
  destinations: destinationsModel,
  packages: packagesModel,
  reservations: reservationsModel,
  staff: staffModel,
  users: usersModel,
  vehicles: VehiclesModel,
};

const TABLE_LABELS = {
  customers: "Cliente",
  destinations: "Destino",
  packages: "Paquete",
  reservations: "Reserva",
  staff: "Empleado",
  users: "Usuario",
  vehicles: "Vehículo",
};

export const getAllTrash = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const { table } = req.query;

    const where = {};
    if (table && table !== "all") {
      where.table_name = table;
    }

    const { rows, count } = await trashModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [["deleted_at", "DESC"]],
    });

    const enriched = rows.map((item) => {
      const data = item.data || {};
      const tableName = item.table_name;
      const label = TABLE_LABELS[tableName] || tableName;
      let summary = "";

      if (data.name) summary = data.name;
      else if (data.username) summary = data.username;
      else if (data.title) summary = data.title;
      else summary = `ID ${item.record_id}`;

      return {
        ...item.toJSON(),
        typeLabel: label,
        summary,
      };
    });

    res.json({
      success: true,
      data: enriched,
      pagination: getPaginationResponse(page, limit, count),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando papelera",
      error: error.message,
    });
  }
};

export const restoreTrashItem = async (req, res) => {
  try {
    const { id } = req.params;
    const trashItem = await trashModel.findByPk(id);

    if (!trashItem) {
      return res.status(404).json({ success: false, message: "Elemento no encontrado en la papelera" });
    }

    const model = MODEL_MAP[trashItem.table_name];
    if (!model) {
      return res.status(400).json({ success: false, message: `No se puede restaurar elementos de tipo "${trashItem.table_name}"` });
    }

    const data = trashItem.data;
    const pkField = model.primaryKeyAttribute;

    const existing = await model.findByPk(trashItem.record_id);
    if (existing) {
      return res.status(409).json({ success: false, message: `El registro ya existe. No se puede restaurar automáticamente.` });
    }

    await model.create({ ...data, [pkField]: trashItem.record_id });
    await trashItem.destroy();

    if (trashItem.table_name === "destinations" || trashItem.table_name === "packages") {
      deleteCachePattern(`cache:${trashItem.table_name}:*`).catch((err) => {
        console.error(`[Trash Controller] Error al invalidar caché para ${trashItem.table_name}:`, err.message);
      });
    }

    res.json({ success: true, message: "Elemento restaurado correctamente" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ success: false, message: "Conflicto: el ID ya está en uso. No se pudo restaurar." });
    }
    res.status(500).json({
      success: false,
      message: "Error restaurando elemento",
      error: error.message,
    });
  }
};

export const permanentDeleteTrashItem = async (req, res) => {
  try {
    const { id } = req.params;
    const trashItem = await trashModel.findByPk(id);

    if (!trashItem) {
      return res.status(404).json({ success: false, message: "Elemento no encontrado en la papelera" });
    }

    await trashItem.destroy();
    res.json({ success: true, message: "Elemento eliminado permanentemente" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando elemento",
      error: error.message,
    });
  }
};

export const getTrashItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const trashItem = await trashModel.findByPk(id);

    if (!trashItem) {
      return res.status(404).json({ success: false, message: "Elemento no encontrado en la papelera" });
    }

    const data = trashItem.data || {};
    const tableName = trashItem.table_name;
    const label = TABLE_LABELS[tableName] || tableName;
    let summary = "";

    if (data.name) summary = data.name;
    else if (data.username) summary = data.username;
    else if (data.title) summary = data.title;
    else summary = `ID ${trashItem.record_id}`;

    res.json({
      success: true,
      data: {
        ...trashItem.toJSON(),
        typeLabel: label,
        summary,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando elemento",
      error: error.message,
    });
  }
};
