const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login } = require("../controllers/authController");

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos, inténtalo de nuevo más tarde" }
});

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

module.exports = router;
