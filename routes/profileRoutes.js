const express = require("express");
const authMiddleware = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  listProfiles,
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  uploadProfilePhoto
} = require("../controllers/profilesController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listProfiles);
router.post("/", createProfile);
router.get("/:id", getProfileById);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);
router.post("/:id/foto", upload.single("foto"), uploadProfilePhoto);

module.exports = router;
