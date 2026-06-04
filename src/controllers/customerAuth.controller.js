import bcrypt from "bcrypt";
import { customersModel } from "../models/customers.models.js";
import { reservationsModel } from "../models/reservations.models.js";
import { packagesModel } from "../models/packages.models.js";
import { generateToken } from "../middleware/auth.middleware.js";
import { validateData } from "../middleware/validation.middleware.js";
import {
  registerCustomerSchema,
  loginCustomerSchema,
  updateCustomerPasswordSchema,
} from "../validations/schemas.js";

const CUSTOMER_TOKEN_EXPIRATION = "7d";

const sanitizeCustomer = (customer) => ({
  id: customer.id_customer,
  name: customer.name,
  lastname: customer.lastname,
  email: customer.email,
  dni: customer.dni,
  phone_number: customer.phone_number,
});

export const registerCustomer = async (req, res) => {
  try {
    const validation = validateData(registerCustomerSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Error en validación",
        errors: validation.errors,
      });
    }

    const { name, email, password } = validation.data;

    const existing = await customersModel.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya está registrado",
      });
    }

    const customer = await customersModel.create({ name, email, password });

    const token = generateToken(
      { id: customer.id_customer, email: customer.email },
      CUSTOMER_TOKEN_EXPIRATION,
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeCustomer(customer),
      },
    });
  } catch (error) {
    console.error("Error en registro de cliente:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
};

export const loginCustomer = async (req, res) => {
  try {
    const validation = validateData(loginCustomerSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
        errors: validation.errors,
      });
    }

    const { email, password } = validation.data;

    const customer = await customersModel.findOne({ where: { email } });
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    if (!customer.password) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const token = generateToken(
      { id: customer.id_customer, email: customer.email },
      CUSTOMER_TOKEN_EXPIRATION,
    );

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeCustomer(customer),
      },
    });
  } catch (error) {
    console.error("Error en login de cliente:", error.message);
    res.status(500).json({
      success: false,
      message: "Error en autenticación",
      error: error.message,
    });
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await customersModel.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      data: {
        user: sanitizeCustomer(customer),
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

export const changeCustomerPassword = async (req, res) => {
  try {
    const validation = validateData(updateCustomerPasswordSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Error en validación",
        errors: validation.errors,
      });
    }

    const { current_password, new_password } = validation.data;

    const customer = await customersModel.findByPk(req.user.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      current_password,
      customer.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }

    customer.password = new_password;
    await customer.save();

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

export const getCustomerReservations = async (req, res) => {
  try {
    const customer = await customersModel.findByPk(req.user.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const reservations = await reservationsModel.findAll({
      where: { id_customer: customer.id_customer },
      include: [
        {
          model: packagesModel,
          attributes: ["name", "departure_date", "return_date"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const data = reservations.map((r) => ({
      id_reservation: r.id_reservation,
      pay_state: r.pay_state,
      packageName: r.Package?.name || `Paquete #${r.id_package}`,
      id_package: r.id_package,
      date: r.reservation_date,
      people: null,
      dni: customer.dni,
      name: customer.name,
      lastname: customer.lastname,
      email: customer.email,
      phone_number: customer.phone_number,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    res.json({
      success: true,
      data: { reservations: data },
    });
  } catch (error) {
    console.error("Error al obtener reservas del cliente:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al obtener reservas",
      error: error.message,
    });
  }
};
