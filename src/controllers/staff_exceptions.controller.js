import { StaffExceptionModel } from "../models/staff_schedule_exceptions.models.js";

export const getExceptions = async (req, res) => {
  try {
    const { id } = req.params;
    const exceptions = await StaffExceptionModel.findAll({
      where: { id_staff: id },
      order: [["date", "DESC"]],
    });
    res.json({ success: true, data: exceptions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error cargando excepciones", error: error.message });
  }
};

export const createException = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, reason, is_working_day, start_time, end_time, notes } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ success: false, message: "Fecha y motivo son requeridos" });
    }

    const exception = await StaffExceptionModel.create({
      id_staff: id,
      date,
      reason,
      is_working_day: is_working_day === true,
      start_time: start_time || null,
      end_time: end_time || null,
      attachment_path: req.file?.path || null,
      attachment_name: req.file?.originalname || null,
      attachment_mime: req.file?.mimetype || null,
      notes: notes || null,
    });

    res.status(201).json({ success: true, data: exception });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creando excepción", error: error.message });
  }
};

export const downloadExceptionAttachment = async (req, res) => {
  try {
    const { exceptionId } = req.params;
    const exception = await StaffExceptionModel.findByPk(exceptionId);

    if (!exception) {
      return res.status(404).json({ success: false, message: "Excepción no encontrada" });
    }
    if (!exception.attachment_path) {
      return res.status(404).json({ success: false, message: "Esta excepción no tiene archivo adjunto" });
    }

    const fs = await import("fs");
    if (!fs.existsSync(exception.attachment_path)) {
      return res.status(404).json({ success: false, message: "Archivo no encontrado en el servidor" });
    }

    res.download(exception.attachment_path, exception.attachment_name);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error descargando archivo", error: error.message });
  }
};

export const deleteException = async (req, res) => {
  try {
    const { exceptionId } = req.params;
    const exception = await StaffExceptionModel.findByPk(exceptionId);

    if (!exception) {
      return res.status(404).json({ success: false, message: "Excepción no encontrada" });
    }

    if (exception.attachment_path) {
      const fs = await import("fs");
      if (fs.existsSync(exception.attachment_path)) {
        fs.unlinkSync(exception.attachment_path);
      }
    }

    await exception.destroy();
    res.json({ success: true, message: "Excepción eliminada" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error eliminando excepción", error: error.message });
  }
};