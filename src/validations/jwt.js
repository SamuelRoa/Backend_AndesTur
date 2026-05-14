import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";

// ==================== GENERAR TOKEN ====================
export const generateToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  } catch (error) {
    console.error("Error generando token:", error.message);
    return null;
  }
};

// ==================== VERIFICAR TOKEN ====================
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { error: "Token expirado", expired: true };
    }
    if (error.name === "JsonWebTokenError") {
      return { error: "Token inválido", invalid: true };
    }
    return { error: "Error al verificar token" };
  }
};

// ==================== DECODIFICAR TOKEN ====================
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token no proporcionado",
    });
  }

  const decoded = verifyToken(token);

  if (decoded.error) {
    return res.status(401).json({
      success: false,
      message: decoded.error,
    });
  }

  req.user = decoded;
  next();
};

// ==================== MIDDLEWARE DE AUTORIZACIÓN (ROLES) ====================
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};
