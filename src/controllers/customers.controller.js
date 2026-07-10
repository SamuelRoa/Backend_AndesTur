import { customersModel } from "../models/customers.models.js";
import { getPaginationParams, getPaginationResponse } from "./pagination.js";
import { moveToTrash } from "../utils/trash.helper.js";

export const getAllCustomers = async (req, res) => {
  try {
    if (req.query.all === 'true') {
      const customers = await customersModel.findAll({ order: [['id_customer', 'ASC']] });
      return res.json({ success: true, data: customers });
    }
    const { page, limit, offset } = getPaginationParams(req);
    const { rows, count } = await customersModel.findAndCountAll({
      limit,
      offset,
      order: [['id_customer', 'ASC']],
    });
    res.json({
      success: true,
      data: rows,
      pagination: getPaginationResponse(page, limit, count),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando clientes",
      error: error.message,
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customersModel.findByPk(id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente no encontrado" });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando cliente",
      error: error.message,
    });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await customersModel.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando cliente",
      error: error.message,
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await customersModel.update(req.body, {
      where: { id_customer: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente no encontrado" });
    }

    const updatedCustomer = await customersModel.findByPk(id);
    res.json({ success: true, data: updatedCustomer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando cliente",
      error: error.message,
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await moveToTrash(customersModel, id, req.user?.id_user);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente no encontrado" });
    }

    res.json({ success: true, message: "Cliente movido a la papelera" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando cliente",
      error: error.message,
    });
  }
};
