import { StateModel } from "../models/state.models.js";

export const getAllStates = async (req, res) => {
  try {
    const states = await StateModel.findAll();
    res.json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando estados",
      error: error.message,
    });
  }
};

export const getStateById = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await StateModel.findByPk(id);

    if (!state) {
      return res
        .status(404)
        .json({ success: false, message: "Estado no encontrado" });
    }

    res.json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando estado",
      error: error.message,
    });
  }
};

export const createState = async (req, res) => {
  try {
    const state = await StateModel.create(req.body);
    res.status(201).json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando estado",
      error: error.message,
    });
  }
};

export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await StateModel.update(req.body, {
      where: { id_state: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Estado no encontrado" });
    }

    const updatedState = await StateModel.findByPk(id);
    res.json({ success: true, data: updatedState });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando estado",
      error: error.message,
    });
  }
};

export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StateModel.destroy({
      where: { id_state: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Estado no encontrado" });
    }

    res.json({ success: true, message: "Estado eliminado" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando estado",
      error: error.message,
    });
  }
};
