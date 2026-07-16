import { StaffDocumentsModel } from "../models/staff_documents.models.js";
import { uploadBuffer, deleteByUrl } from "../utils/cloudinary.js";
import { CLOUDINARY_FOLDER } from "../utils/cloudinary.js";

export const getDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await StaffDocumentsModel.findAll({
      where: { id_staff: id },
      order: [["uploaded_at", "DESC"]],
    });
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error cargando documentos", error: error.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { document_type, notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se envió ningún archivo" });
    }
    if (!document_type) {
      return res.status(400).json({ success: false, message: "El tipo de documento es requerido" });
    }

    const result = await uploadBuffer(req.file.buffer, {
      public_id: `${id}_${Date.now()}`,
      resource_type: "auto",
    });

    const doc = await StaffDocumentsModel.create({
      id_staff: id,
      document_type,
      file_name: req.file.originalname,
      file_path: result.secure_url,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      notes: notes || null,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error subiendo documento", error: error.message });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await StaffDocumentsModel.findByPk(docId);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Documento no encontrado" });
    }

    if (doc.file_path?.startsWith("http")) {
      return res.redirect(doc.file_path);
    }

    const fs = await import("fs");
    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ success: false, message: "Archivo no encontrado en el servidor" });
    }

    res.download(doc.file_path, doc.file_name);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error descargando documento", error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await StaffDocumentsModel.findByPk(docId);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Documento no encontrado" });
    }

    await deleteByUrl(doc.file_path);

    const fs = await import("fs");
    if (!doc.file_path?.startsWith("http") && fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    await doc.destroy();
    res.json({ success: true, message: "Documento eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error eliminando documento", error: error.message });
  }
};