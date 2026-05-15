import bcrypt from "bcrypt";
import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";
import { generateToken } from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validation.middleware.js";
import { AppError } from "../middleware/errorHandler.middleware.js";
import { loginSchema, createUserSchema } from "../validations/schemas.js";

// ==================== REGISTRO ====================
export const register = async (req, res) => {
  try {
    // Validar datos
    const validation = validateData(createUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Error en validación",
        errors: validation.errors,
      });
    }

    const { username, email, password, id_role, state } = validation.data;

    // Verificar si el usuario ya existe
    const existingUser = await usersModel.findOne({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    // Verificar que el rol existe
    const role = await rolesModel.findByPk(id_role);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rol no encontrado",
      });
    }

    const newUser = await usersModel.create({
      username,
      email,
      password,
      id_role,
      state,
    });

    // Generar token
    const token = generateToken({
      id_user: newUser.id_user,
      email: newUser.email,
      username: newUser.username,
      role: role.type,
    });

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        id_user: newUser.id_user,
        username: newUser.username,
        email: newUser.email,
        state: newUser.state,
      },
      token,
    });
  } catch (error) {
    console.error("Error en registro:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
};

// ==================== LOGIN ====================
export const login = async (req, res) => {
  try {
    // Validar datos
    const validation = validateData(loginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
        errors: validation.errors,
      });
    }

    const { email, password } = validation.data;

    // Buscar usuario
    const user = await usersModel.findOne({
      where: { email },
      include: [{ model: rolesModel, as: "role", attributes: ["type"] }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Verificar que el usuario está activo
    if (user.state !== "active") {
      return res.status(403).json({
        success: false,
        message: `Usuario ${user.state}`,
      });
    }

    // Generar token
    const token = generateToken({
      id_user: user.id_user,
      email: user.email,
      username: user.username,
      role: user.role?.type || "user",
    });

    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        state: user.state,
      },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error.message);
    res.status(500).json({
      success: false,
      message: "Error en autenticación",
      error: error.message,
    });
  }
};

// ==================== VERIFICAR TOKEN ====================
export const verifyAuth = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "No autenticado",
    });
  }

  res.json({
    success: true,
    message: "Token válido",
    user: req.user,
  });
};

// ==================== OBTENER PERFIL ====================
export const getProfile = async (req, res) => {
  try {
    const user = await usersModel.findByPk(req.user.id_user, {
      attributes: { exclude: ["password"] },
      include: [{ model: rolesModel, as: "role" }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al obtener perfil",
      error: error.message,
    });
  }
};
