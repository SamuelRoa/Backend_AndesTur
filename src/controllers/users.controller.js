import bcrypt from "bcrypt";
import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";
import { moveToTrash } from "../utils/trash.helper.js";

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await usersModel.findAndCountAll({
      attributes: { exclude: ["password"] },
      include: [{ model: rolesModel, as: "role", attributes: ["type", "permissions"] }],
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    const data = rows.map((user) => {
      const json = user.toJSON();
      return {
        ...json,
        role: json.role?.type || null,
        permissions: json.role?.permissions || [],
        activo: json.state === "active",
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
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
    const user = await usersModel.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [{ model: rolesModel, as: "role", attributes: ["type", "permissions"] }],
    });

     if (!user) {
       return res
         .status(404)
         .json({ success: false, message: "Usuario no encontrado" });
     }

     const json = user.toJSON();
     res.json({
       success: true,
       data: { ...json, role: json.role?.type || null, permissions: json.role?.permissions || [], activo: json.state === "active" },
     });
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
    // Ensure role is set via id_role
    const body = { ...req.body };
    if (body.role && !body.id_role) {
      const role = await rolesModel.findOne({ where: { type: body.role } });
      if (role) body.id_role = role.id_role;
      delete body.role;
    }
    const user = await usersModel.create(body);
    const safeUser = await usersModel.findByPk(user.id_user, {
      attributes: { exclude: ["password"] },
      include: [{ model: rolesModel, as: "role", attributes: ["type", "permissions"] }],
    });
    const createJson = safeUser.toJSON();
    res.status(201).json({
      success: true,
      data: { ...createJson, role: createJson.role?.type || null, permissions: createJson.role?.permissions || [], activo: createJson.state === "active" },
    });
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
    const body = { ...req.body };

    // Map role to id_role if provided as string
    if (body.role && typeof body.role === "string") {
      const role = await rolesModel.findOne({ where: { type: body.role } });
      if (role) body.id_role = role.id_role;
      delete body.role;
    }

    // Map activo to state if provided
    if (body.activo !== undefined) {
      body.state = body.activo ? "active" : "inactive";
      delete body.activo;
    }

    const [updated] = await usersModel.update(body, {
      where: { id_user: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    const updatedUser = await usersModel.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [{ model: rolesModel, as: "role", attributes: ["type", "permissions"] }],
    });
    const updateJson = updatedUser.toJSON();
    res.json({
      success: true,
      data: { ...updateJson, role: updateJson.role?.type || null, permissions: updateJson.role?.permissions || [], activo: updateJson.state === "active" },
    });
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
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({
        success: false,
        message: "Debes ingresar tu contraseña para eliminar un usuario",
      });
    }

    const admin = await usersModel.findByPk(req.user.id_user);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Administrador no encontrado",
      });
    }

    const valid = await bcrypt.compare(adminPassword, admin.password);
    if (!valid) {
      return res.status(403).json({
        success: false,
        message: "Contraseña incorrecta. No se puede eliminar el usuario.",
      });
    }

    const result = await moveToTrash(usersModel, id, req.user?.id_user);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, message: "Usuario movido a la papelera" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando usuario",
      error: error.message,
    });
  }
};
