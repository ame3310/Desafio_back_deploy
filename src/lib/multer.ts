import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

// 10 MB 
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  const ok =
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "application/pdf";

  if (!ok) {
    return cb(new Error("Tipo de archivo no permitido (usa PNG, JPG o PDF)")); //poner en constant errors
  }
  cb(null, true);
}

export const uploadTicketFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
