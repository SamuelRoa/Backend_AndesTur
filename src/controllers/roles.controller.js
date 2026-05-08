import { rolesModel } from "../models/roles.models.js";

export const getAllRoles = async (req, res) => {
  try {
    const roles = await rolesModel.findAll();
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando roles",
      error: error.message,
    });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await rolesModel.findByPk(id);

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Rol no encontrado" });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando rol",
      error: error.message,
    });
  }
};

export const createRole = async (req, res) => {
  try {
    const role = await rolesModel.create(req.body);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando rol",
      error: error.message,
    });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await rolesModel.update(req.body, {
      where: { id_role: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Rol no encontrado" });
    }

    const updatedRole = await rolesModel.findByPk(id);
    res.json({ success: true, data: updatedRole });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando rol",
      error: error.message,
    });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await rolesModel.destroy({
      where: { id_role: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Rol no encontrado" });
    }

    res.json({ success: true, message: "Rol eliminado" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando rol",
      error: error.message,
    });
  }
};
