const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { validateEmail, validatePassword } = require("../utils/validators");

const register = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Formato de email inválido" });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: "La contraseña debe tener 8 caracteres, una mayúscula y un número" });
  }

  try {
    const connection = await getConnection();
    const existing = await connection.execute(
      "SELECT id FROM usuarios WHERE email = :email",
      { email }
    );

    if (existing.rows.length > 0) {
      await connection.close();
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await connection.execute(
      "INSERT INTO usuarios (email, password_hash) VALUES (:email, :password_hash) RETURNING id INTO :id",
      {
        email,
        password_hash: passwordHash,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    await connection.commit();
    await connection.close();

    const userId = result.outBinds.id[0];
    return res.status(201).json({ id: userId, email });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Formato de email inválido" });
  }

  try {
    const connection = await getConnection();
    const result = await connection.execute(
      "SELECT id, email, password_hash FROM usuarios WHERE email = :email",
      { email }
    );

    await connection.close();

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.PASSWORD_HASH);

    if (!isValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { sub: user.ID, email: user.EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
    );

    return res.json({ token });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login
};
