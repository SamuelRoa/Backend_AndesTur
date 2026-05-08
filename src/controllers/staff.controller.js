import { staffModel } from "../models/staff.models.js";

export const getAllStaff = async (req, res) => {
  try {
    const staff = await staffModel.findAll();
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando personal",
      error: error.message,
    });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staffMember = await staffModel.findByPk(id);

    if (!staffMember) {
      return res
        .status(404)
        .json({ success: false, message: "Personal no encontrado" });
    }

    res.json({ success: true, data: staffMember });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando personal",
      error: error.message,
    });
  }
};

export const createStaff = async (req, res) => {
  try {
    const staffMember = await staffModel.create(req.body);
    res.status(201).json({ success: true, data: staffMember });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando personal",
      error: error.message,
    });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await staffModel.update(req.body, {
      where: { id_staff: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Personal no encontrado" });
    }

    const updatedStaff = await staffModel.findByPk(id);
    res.json({ success: true, data: updatedStaff });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando personal",
      error: error.message,
    });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await staffModel.destroy({
      where: { id_staff: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Personal no encontrado" });
    }

    res.json({ success: true, message: "Personal eliminado" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando personal",
      error: error.message,
    });
  }
};
