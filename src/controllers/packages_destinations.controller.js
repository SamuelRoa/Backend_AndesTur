import { PackagesDestinationsModel } from "../models/packages_destinations.models.js";

export const getAllPackagesDestinations = async (req, res) => {
  try {
    const records = await PackagesDestinationsModel.findAll();
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando paquetes-destinos",
      error: error.message,
    });
  }
};

export const getPackageDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await PackagesDestinationsModel.findByPk(id);

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

export const createPackageDestination = async (req, res) => {
  try {
    const record = await PackagesDestinationsModel.create(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando registro",
      error: error.message,
    });
  }
};

export const updatePackageDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await PackagesDestinationsModel.update(req.body, {
      where: { id_package_destination: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Registro no encontrado" });
    }

    const updatedRecord = await PackagesDestinationsModel.findByPk(id);
    res.json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando registro",
      error: error.message,
    });
  }
};

export const deletePackageDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PackagesDestinationsModel.destroy({
      where: { id_package_destination: id },
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
