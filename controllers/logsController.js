const oracledb = require("oracledb");
const { getConnection } = require("../config/db");

const listLogs = async (req, res, next) => {
  const { perfil_id } = req.query;

  try {
    const connection = await getConnection();
    const result = await connection.execute(
      `SELECT b.id, b.perfil_id, b.fecha_registro, b.categoria, b.gramos_alimento_diario, b.observaciones
       FROM bitacora_salud_entrenamiento b
       JOIN perfiles_caninos p ON p.id = b.perfil_id
       WHERE p.usuario_id = :usuario_id
       ${perfil_id ? "AND b.perfil_id = :perfil_id" : ""}
       ORDER BY b.fecha_registro DESC`,
      perfil_id
        ? { usuario_id: req.user.id, perfil_id: Number(perfil_id) }
        : { usuario_id: req.user.id }
    );

    await connection.close();
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

const createLog = async (req, res, next) => {
  const { perfil_id, fecha_registro, categoria, gramos_alimento_diario, observaciones } = req.body;

  if (!perfil_id || !categoria) {
    return res.status(400).json({ message: "perfil_id y categoria son obligatorios" });
  }

  try {
    const connection = await getConnection();
    const owner = await connection.execute(
      "SELECT id FROM perfiles_caninos WHERE id = :perfil_id AND usuario_id = :usuario_id",
      { perfil_id: Number(perfil_id), usuario_id: req.user.id }
    );

    if (owner.rows.length === 0) {
      await connection.close();
      return res.status(403).json({ message: "No tienes acceso a este perfil" });
    }

    const result = await connection.execute(
      "INSERT INTO bitacora_salud_entrenamiento (perfil_id, fecha_registro, categoria, gramos_alimento_diario, observaciones) VALUES (:perfil_id, :fecha_registro, :categoria, :gramos_alimento_diario, :observaciones) RETURNING id INTO :id",
      {
        perfil_id: Number(perfil_id),
        fecha_registro: fecha_registro ? new Date(fecha_registro) : new Date(),
        categoria,
        gramos_alimento_diario: gramos_alimento_diario ? Number(gramos_alimento_diario) : null,
        observaciones: observaciones || null,
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

const updateLog = async (req, res, next) => {
  const { categoria, gramos_alimento_diario, observaciones, fecha_registro } = req.body;

  try {
    const connection = await getConnection();
    const result = await connection.execute(
      `UPDATE bitacora_salud_entrenamiento b
       SET categoria = :categoria,
           gramos_alimento_diario = :gramos_alimento_diario,
           observaciones = :observaciones,
           fecha_registro = :fecha_registro
       WHERE b.id = :id
       AND EXISTS (
         SELECT 1 FROM perfiles_caninos p
         WHERE p.id = b.perfil_id AND p.usuario_id = :usuario_id
       )`,
      {
        categoria,
        gramos_alimento_diario: gramos_alimento_diario ? Number(gramos_alimento_diario) : null,
        observaciones: observaciones || null,
        fecha_registro: fecha_registro ? new Date(fecha_registro) : new Date(),
        id: req.params.id,
        usuario_id: req.user.id
      }
    );

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    await connection.commit();
    await connection.close();
    return res.json({ message: "Bitácora actualizada" });
  } catch (error) {
    return next(error);
  }
};

const deleteLog = async (req, res, next) => {
  try {
    const connection = await getConnection();
    const result = await connection.execute(
      `DELETE FROM bitacora_salud_entrenamiento b
       WHERE b.id = :id
       AND EXISTS (
         SELECT 1 FROM perfiles_caninos p
         WHERE p.id = b.perfil_id AND p.usuario_id = :usuario_id
       )`,
      { id: req.params.id, usuario_id: req.user.id }
    );

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    await connection.commit();
    await connection.close();
    return res.json({ message: "Bitácora eliminada" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listLogs,
  createLog,
  updateLog,
  deleteLog
};
