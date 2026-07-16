import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const createStorage = (subDir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(ROOT, "uploads", "staff", subDir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const id = req.params?.id || "unknown";
      const ts = Date.now();
      const ext = path.extname(file.originalname);
      const safeName = `${id}_${ts}${ext}`;
      cb(null, safeName);
    },
  });

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Use PDF, JPG, PNG, DOC o DOCX.`), false);
  }
};

export const uploadDocument = multer({
  storage: createStorage("documents"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

export const uploadException = multer({
  storage: createStorage("exceptions"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});