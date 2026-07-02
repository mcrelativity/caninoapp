const multer = require("multer");
const { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES } = require("../config/blobStorage");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_CONTENT_TYPES.includes(file.mimetype)) {
      const error = new Error("Formato de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o WEBP.");
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  }
});

module.exports = upload;
