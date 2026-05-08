import { PaymentDetailModel } from "../models/payment_detail.models.js";

export const getAllPaymentDetails = async (req, res) => {
  try {
    const details = await PaymentDetailModel.findAll();
    res.json({ success: true, data: details });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cargando detalles de pago",
      error: error.message,
    });
  }
};

export const getPaymentDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await PaymentDetailModel.findByPk(id);

    if (!detail) {
      return res
        .status(404)
        .json({ success: false, message: "Detalle de pago no encontrado" });
    }

    res.json({ success: true, data: detail });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error buscando detalle de pago",
      error: error.message,
    });
  }
};

export const createPaymentDetail = async (req, res) => {
  try {
    const detail = await PaymentDetailModel.create(req.body);
    res.status(201).json({ success: true, data: detail });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando detalle de pago",
      error: error.message,
    });
  }
};

export const updatePaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await PaymentDetailModel.update(req.body, {
      where: { id_payment_detail: id },
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Detalle de pago no encontrado" });
    }

    const updatedDetail = await PaymentDetailModel.findByPk(id);
    res.json({ success: true, data: updatedDetail });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error actualizando detalle de pago",
      error: error.message,
    });
  }
};

export const deletePaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PaymentDetailModel.destroy({
      where: { id_payment_detail: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Detalle de pago no encontrado" });
    }

    res.json({ success: true, message: "Detalle de pago eliminado" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error eliminando detalle de pago",
      error: error.message,
    });
  }
};
