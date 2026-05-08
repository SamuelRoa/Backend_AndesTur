import { PaymentHeaderModel } from "../models/payment_header.models.js";

export const getAllPaymentHeaders = async (req, res) => {
  try {
    const headers = await PaymentHeaderModel.findAll();
    res.json({ success: true, data: headers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando encabezados de pago",
      error: error.message,
    });
  }
};

export const getPaymentHeaderById = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await PaymentHeaderModel.findByPk(id);

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Encabezado de pago no encontrado" });
    }

    res.json({ success: true, data: header });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando encabezado de pago",
      error: error.message,
    });
  }
};

export const createPaymentHeader = async (req, res) => {
  try {
    const header = await PaymentHeaderModel.create(req.body);
    res.status(201).json({ success: true, data: header });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando encabezado de pago",
      error: error.message,
    });
  }
};

export const updatePaymentHeader = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await PaymentHeaderModel.update(req.body, {
      where: { id_payment_header: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Encabezado de pago no encontrado" });
    }

    const updatedHeader = await PaymentHeaderModel.findByPk(id);
    res.json({ success: true, data: updatedHeader });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando encabezado de pago",
      error: error.message,
    });
  }
};

export const deletePaymentHeader = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PaymentHeaderModel.destroy({
      where: { id_payment_header: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Encabezado de pago no encontrado" });
    }

    res.json({ success: true, message: "Encabezado de pago eliminado" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando encabezado de pago",
      error: error.message,
    });
  }
};
