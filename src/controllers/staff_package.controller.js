import { StaffPackageModel } from "../models/staff_package.models.js";

export const getAllStaffPackages = async (req, res) => {
  try {
    const records = await StaffPackageModel.findAll();
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando personal-paquete",
      error: error.message,
    });
  }
};

export const getStaffPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await StaffPackageModel.findByPk(id);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Registro no encontrado" });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando registro",
      error: error.message,
    });
  }
};

export const createStaffPackage = async (req, res) => {
  try {
    const record = await StaffPackageModel.create(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando registro",
      error: error.message,
    });
  }
};

export const updateStaffPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await StaffPackageModel.update(req.body, {
      where: { id_staff_package: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Registro no encontrado" });
    }

    const updatedRecord = await StaffPackageModel.findByPk(id);
    res.json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando registro",
      error: error.message,
    });
  }
};

export const deleteStaffPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StaffPackageModel.destroy({
      where: { id_staff_package: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Registro no encontrado" });
    }

    res.json({ success: true, message: "Registro eliminado" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando registro",
      error: error.message,
    });
  }
};
