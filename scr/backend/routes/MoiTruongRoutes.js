const express = require("express");
const router = express.Router();
const {
  createEnvironment,
  getEnvironments,
  getEnvironmentById,
  updateEnvironment,
  deleteEnvironment
} = require("../controllers/MoiTruongController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createEnvironment);
router.get("/", getEnvironments);
router.get("/:id", getEnvironmentById);
router.put("/:id", updateEnvironment);
router.delete("/:id", deleteEnvironment);

module.exports = router;
