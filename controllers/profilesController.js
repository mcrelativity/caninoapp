const oracledb = require("oracledb");
const crypto = require("crypto");
const { getConnection } = require("../config/db");
const blobStorage = require("../config/blobStorage");

const CONTENT_TYPE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const attachFotoUrl = async (row) => {
  if (!row.FOTO_BLOB_NAME) {
    return { ...row, FOTO_URL: null };
  }
  const fotoUrl = await blobStorage.generateReadSasUrl(row.FOTO_BLOB_NAME);
  return { ...row, FOTO_URL: fotoUrl };
};

const listProfiles = async (req, res, next) => {
  try {
    const connection = await getConnection();
    const result = await connection.execute(
      "SELECT id, usuario_id, nombre, raza, fecha_nacimiento, peso_actual_kg, foto_blob_name FROM perfiles_caninos WHERE usuario_id = :usuario_id ORDER BY id",
      { usuario_id: req.user.id }
    );

    await connection.close();
    const rows = await Promise.all(result.rows.map(attachFotoUrl));
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
};

const createProfile = async (req, res, next) => {
  const { nombre, raza, fecha_nacimiento, peso_actual_kg } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: "El nombre del cachorro es obligatorio" });
  }

  try {
    const connection = await getConnection();
    const result = await connection.execute(
      "INSERT INTO perfiles_caninos (usuario_id, nombre, raza, fecha_nacimiento, peso_actual_kg) VALUES (:usuario_id, :nombre, :raza, :fecha_nacimiento, :peso_actual_kg) RETURNING id INTO :id",
      {
        usuario_id: req.user.id,
        nombre,
        raza: raza || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        peso_actual_kg: peso_actual_kg ? Number(peso_actual_kg) : null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    await connection.commit();
    await connection.close();

    return res.status(201).json({ id: result.outBinds.id[0] });
  } catch (error) {
    return next(error);
  }
};

const getProfileById = async (req, res, next) => {
  try {
    const connection = await getConnection();
    const result = await connection.execute(
      "SELECT id, usuario_id, nombre, raza, fecha_nacimiento, peso_actual_kg, foto_blob_name FROM perfiles_caninos WHERE id = :id AND usuario_id = :usuario_id",
      { id: req.params.id, usuario_id: req.user.id }
    );

    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    return res.json(await attachFotoUrl(result.rows[0]));
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const { nombre, raza, fecha_nacimiento, peso_actual_kg } = req.body;

  try {
    const connection = await getConnection();
    const result = await connection.execute(
      "UPDATE perfiles_caninos SET nombre = :nombre, raza = :raza, fecha_nacimiento = :fecha_nacimiento, peso_actual_kg = :peso_actual_kg WHERE id = :id AND usuario_id = :usuario_id",
      {
        nombre,
        raza,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        peso_actual_kg: peso_actual_kg ? Number(peso_actual_kg) : null,
        id: req.params.id,
        usuario_id: req.user.id
      }
    );

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    await connection.commit();
    await connection.close();
    return res.json({ message: "Perfil actualizado" });
  } catch (error) {
    return next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const connection = await getConnection();
    const result = await connection.execute(
      "DELETE FROM perfiles_caninos WHERE id = :id AND usuario_id = :usuario_id",
      { id: req.params.id, usuario_id: req.user.id }
    );

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    await connection.commit();
    await connection.close();
    return res.json({ message: "Perfil eliminado" });
  } catch (error) {
    return next(error);
  }
};

const uploadProfilePhoto = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "Debes adjuntar un archivo de imagen" });
  }

  try {
    const connection = await getConnection();
    const existing = await connection.execute(
      "SELECT foto_blob_name FROM perfiles_caninos WHERE id = :id AND usuario_id = :usuario_id",
      { id: req.params.id, usuario_id: req.user.id }
    );

    if (existing.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    const extension = CONTENT_TYPE_EXTENSIONS[req.file.mimetype] || "";
    const blobName = `perfiles/${req.user.id}/${req.params.id}/${crypto.randomUUID()}${extension}`;

    await blobStorage.uploadBuffer(blobName, req.file.buffer, req.file.mimetype);

    await connection.execute(
      "UPDATE perfiles_caninos SET foto_blob_name = :foto_blob_name WHERE id = :id AND usuario_id = :usuario_id",
      { foto_blob_name: blobName, id: req.params.id, usuario_id: req.user.id }
    );
    await connection.commit();

    const previousBlobName = existing.rows[0].FOTO_BLOB_NAME;
    await connection.close();

    if (previousBlobName) {
      await blobStorage.deleteBlob(previousBlobName);
    }

    const fotoUrl = await blobStorage.generateReadSasUrl(blobName);
    return res.status(200).json({ message: "Foto actualizada", foto_url: fotoUrl });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listProfiles,
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  uploadProfilePhoto
};
