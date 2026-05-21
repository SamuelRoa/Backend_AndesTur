import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: object
 *                       properties:
 *                         id_role:
 *                           type: integer
 *                         type:
 *                           type: string
 *       401:
 *         description: No autenticado o token inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id_user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "No autenticado",
      });
    }

    const user = await usersModel.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const userRole = await rolesModel.findByPk(user.id_role);

    return res.json({
      success: true,
      data: {
        id_user: user.id_user,
        email: user.email,
        username: user.username,
        lastname: null,
        role: userRole
          ? { id_role: userRole.id_role, type: userRole.type }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al obtener el perfil",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /users/profile_update:
 *   put:
 *     summary: Actualizar datos del usuario autenticado
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: object
 *                       properties:
 *                         id_role:
 *                           type: integer
 *                         type:
 *                           type: string
 *       400:
 *         description: Solicitud inválida
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id_user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "No autenticado",
      });
    }

    const payload = req.body;
    const allowedUpdates = ["username", "email", "password"];
    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        updateData[field] = payload[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos válidos para actualizar",
      });
    }

    const [updated] = await usersModel.update(updateData, {
      where: { id_user: userId },
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const updatedUser = await usersModel.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    const userRole = await rolesModel.findByPk(updatedUser.id_role);

    return res.json({
      success: true,
      data: {
        id_user: updatedUser.id_user,
        email: updatedUser.email,
        username: updatedUser.username,
        lastname: null,
        role: userRole
          ? { id_role: userRole.id_role, type: userRole.type }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await usersModel.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
      success: false,
      message: "Error eliminando usuario",
      error: error.message,
    });
  }
};
