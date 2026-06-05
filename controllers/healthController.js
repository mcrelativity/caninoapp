const { getConnection } = require("../config/db");

const healthCheck = async (req, res, next) => {
  try {
    const connection = await getConnection();
    await connection.execute("SELECT 1 FROM dual");
    await connection.close();
    return res.json({ status: "ok", database: "reachable" });
  } catch (error) {
    error.status = 503;
    return next(error);
  }
};

module.exports = { healthCheck };
