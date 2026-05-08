import { packagesModel } from "../models/packages.models.js";

export const getAllPackages = async (req, res) => {
  try {
    const packages = await packagesModel.findAll();
    res.json({ success: true, data: packages });
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
    const deleted = await packagesModel.destroy({ where: { id_package: id } });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Paquete no encontrado" });
    }

    res.json({ success: true, message: "Paquete eliminado" });
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
