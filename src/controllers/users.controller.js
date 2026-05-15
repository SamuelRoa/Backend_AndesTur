import { usersModel } from "../models/users.models.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await usersModel.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error cargando usuarios",
        error: error.message,
      });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersModel.findByPk(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error buscando usuario",
        error: error.message,
      });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await usersModel.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error creando usuario",
        error: error.message,
      });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await usersModel.update(req.body, {
      where: { id_user: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    const updatedUser = await usersModel.findByPk(id);
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error actualizando usuario",
        error: error.message,
      });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await usersModel.destroy({ where: { id_user: id } });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error eliminando usuario",
        error: error.message,
      });
  }
};
