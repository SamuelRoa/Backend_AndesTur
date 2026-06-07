import bcrypt from "bcrypt";
import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";
import { generateToken } from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validation.middleware.js";
import { AppError } from "../middleware/errorHandler.middleware.js";
import { loginSchema, createUserSchema } from "../validations/schemas.js";
import { z } from "zod";
import { passwordSchema } from "../validations/schemas.js";
import crypto from "crypto";
import { sendPasswordRecovery } from "../services/emailjs.service.js";

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

    // Si no se envía id_role, asignar el rol 'user' por defecto
    let role = null;
    let roleIdToUse = id_role;
    if (!roleIdToUse) {
      role = await rolesModel.findOne({ where: { type: "user" } });
      if (!role) {
        // Crear rol 'user' si no existe
        role = await rolesModel.create({
          type: "user",
          description: "Usuario por defecto",
        });
      }
      roleIdToUse = role.id_role;
    } else {
      role = await rolesModel.findByPk(roleIdToUse);
      if (!role) {
        return res
          .status(404)
          .json({ success: false, message: "Rol no encontrado" });
      }
    }

    const newUser = await usersModel.create({
      username,
      email,
      password,
      id_role: roleIdToUse,
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

    // Cargar rol del usuario desde la tabla roles
    const userRole = await rolesModel.findByPk(user.id_role);
    const roleType = userRole?.type || "user";

    // Generar token
    const token = generateToken({
      id_user: user.id_user,
      email: user.email,
      username: user.username,
      role: roleType,
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
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const userRole = await rolesModel.findByPk(user.id_role);

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        role: userRole
          ? { id_role: userRole.id_role, type: userRole.type }
          : null,
      },
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

// ==================== CAMBIAR CONTRASEÑA ====================
export const changePassword = async (req, res) => {
  try {
    const changePasswordSchema = z.object({
      current_password: z.string().min(1, "La contraseña actual es requerida"),
      new_password: passwordSchema,
    });

    const validation = validateData(changePasswordSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Error en validación",
        errors: validation.errors,
      });
    }

    const { current_password, new_password } = validation.data;

    // Buscar usuario con contraseña actual
    const user = await usersModel.findByPk(req.user.id_user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      current_password,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }

    // Actualizar contraseña (el hook beforeUpdate en el modelo la hasheará automáticamente)
    user.password = new_password;
    await user.save();

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al cambiar contraseña",
      error: error.message,
    });
  }
};

// ==================== RECUPERAR CONTRASEÑA ====================
export const recoverPassword = async (req, res) => {
  try {
    const emailValidationSchema = z.object({
      email: z.string().email("Email inválido").toLowerCase().trim(),
    });

    const validation = validateData(emailValidationSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Error en validación",
        errors: validation.errors,
      });
    }

    const { email } = validation.data;

    // Buscar usuario
    const user = await usersModel.findOne({
      where: { email },
    });

    // Siempre devolvemos el mismo mensaje por seguridad
    // Pero si el usuario existe, procesamos la recuperación
    if (user) {
      // Generar contraseña aleatoria (1 mayúscula, 1 minúscula, 1 número, 1 especial, 8+ caracteres)
      const randomPassword =
        "A" + crypto.randomBytes(4).toString("hex") + "1!b";

      // Actualizar contraseña
      user.password = randomPassword;
      await user.save();

      try {
        await sendPasswordRecovery({
          to_email: user.email,
          nombre_usuario: user.username,
          password_temporal: randomPassword,
        });
      } catch (mailError) {
        let mailErrDetail;
        try {
          mailErrDetail = JSON.stringify(
            mailError,
            Object.getOwnPropertyNames(mailError),
            2,
          );
        } catch (_) {
          try {
            mailErrDetail = JSON.stringify(mailError);
          } catch (__) {
            mailErrDetail = String(mailError);
          }
        }
        console.error("Error enviando correo de recuperación:", mailErrDetail);
        const mailErrMsg =
          (mailError && mailError.message) || String(mailError);
        const responseMessage =
          process.env.NODE_ENV === "development"
            ? `Error al enviar el correo de recuperación: ${mailErrMsg}`
            : "Error al enviar el correo de recuperación (revisa la configuración de EmailJS)";

        return res.status(500).json({
          success: false,
          message: responseMessage,
        });
      }
    }

    res.json({
      success: true,
      message:
        "Si el correo está registrado, se han enviado las instrucciones para recuperar la contraseña.",
    });
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error.message);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al recuperar contraseña",
      error: error.message,
    });
  }
};
