// ==================== AUTH MIDDLEWARE ====================
// Manejo de JWT y autenticación

import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.middleware.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";

/**
 * Generar JWT token
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} Token JWT firmado
 */
export const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn || JWT_EXPIRATION,
  });
};

/**
 * Verificar JWT token
 * @param {string} token - Token a verificar
 * @returns {Object} {success: boolean, data?: decoded, message?: error}
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, data: decoded };
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token expirado"
        : error.name === "JsonWebTokenError"
          ? "Token inválido"
          : "Error en token";

    return { success: false, message };
  }
};

/**
 * Decodificar JWT sin verificar
 * @param {string} token - Token a decodificar
 * @returns {Object|null} Payload decodificado o null
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Middleware para autenticar JWT
 * Adjunta req.user con los datos decodificados
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      throw new AppError("Token no proporcionado", 401);
    }

    const token = authHeader.replace(/^(Bearer|bearer)\s+/, "").trim();
    if (!token) {
      throw new AppError("Token no proporcionado", 401);
    }

    const result = verifyToken(token);

    if (!result.success) {
      throw new AppError(result.message, 401);
    }

    req.user = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para autorizar por rol
 * Requiere authenticateToken antes
 * @param {...string} allowedRoles - Roles permitidos
 * @returns {Function} Middleware
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError("Usuario no autenticado", 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(
          `Acceso denegado. Se requiere uno de los roles: ${allowedRoles.join(", ")}`,
          403,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
