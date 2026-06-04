const oracledb = require("oracledb");

let pool;

const initOracleClient = () => {
  if (process.env.ORACLE_CLIENT_LIB_DIR || process.env.TNS_ADMIN) {
    oracledb.initOracleClient({
      libDir: process.env.ORACLE_CLIENT_LIB_DIR,
      configDir: process.env.TNS_ADMIN
    });
  }
};

const initPool = async () => {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_CONNECT_STRING) {
    const error = new Error("Faltan variables de entorno de la base de datos.");
    error.status = 500;
    throw error;
  }

  if (!process.env.TNS_ADMIN) {
    const error = new Error("La variable TNS_ADMIN es obligatoria para el Wallet mTLS.");
    error.status = 500;
    throw error;
  }

  initOracleClient();
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.autoCommit = false;

  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1
  });
};

const getConnection = async () => {
  if (!pool) {
    throw new Error("El pool de conexiones no está inicializado.");
  }
  return pool.getConnection();
};

const closePool = async () => {
  if (pool) {
    await pool.close(10);
  }
};

module.exports = {
  initPool,
  getConnection,
  closePool
};
