const express = require("express");
const authMiddleware = require("../middlewares/auth");
const {
  listLogs,
  createLog,
  updateLog,
  deleteLog
} = require("../controllers/logsController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listLogs);
router.post("/", createLog);
router.put("/:id", updateLog);
router.delete("/:id", deleteLog);

module.exports = router;
