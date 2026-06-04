const express = require("express");
const authMiddleware = require("../middlewares/auth");
const {
  listProfiles,
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile
} = require("../controllers/profilesController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listProfiles);
router.post("/", createProfile);
router.get("/:id", getProfileById);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

module.exports = router;
