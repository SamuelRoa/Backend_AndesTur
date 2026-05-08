import { MunicipalityModel } from "../models/municipality.models.js";

export const getAllMunicipalities = async (req, res) => {
  try {
    const municipalities = await MunicipalityModel.findAll();
    res.json({ success: true, data: municipalities });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando municipios",
      error: error.message,
    });
  }
};

export const getMunicipalityById = async (req, res) => {
  try {
    const { id } = req.params;
    const municipality = await MunicipalityModel.findByPk(id);

    if (!municipality) {
      return res
        .status(404)
        .json({ success: false, message: "Municipio no encontrado" });
    }

    res.json({ success: true, data: municipality });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando municipio",
      error: error.message,
    });
  }
};

export const createMunicipality = async (req, res) => {
  try {
    const municipality = await MunicipalityModel.create(req.body);
    res.status(201).json({ success: true, data: municipality });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando municipio",
      error: error.message,
    });
  }
};

export const updateMunicipality = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await MunicipalityModel.update(req.body, {
      where: { id_municipality: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Municipio no encontrado" });
    }

    const updatedMunicipality = await MunicipalityModel.findByPk(id);
    res.json({ success: true, data: updatedMunicipality });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando municipio",
      error: error.message,
    });
  }
};

export const deleteMunicipality = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MunicipalityModel.destroy({
      where: { id_municipality: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Municipio no encontrado" });
    }

    res.json({ success: true, message: "Municipio eliminado" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando municipio",
      error: error.message,
    });
  }
};
