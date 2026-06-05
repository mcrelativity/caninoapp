const path = require("path");
const express = require("express");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { initPool, closePool } = require("./config/db");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const logRoutes = require("./routes/logRoutes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/perfiles", profileRoutes);
app.use("/api/bitacoras", logRoutes);
app.use("/api/health", healthRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Recurso no encontrado" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status >= 500 ? "Error interno del servidor" : err.message;
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await initPool();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("No fue posible iniciar la aplicación:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});

start();
