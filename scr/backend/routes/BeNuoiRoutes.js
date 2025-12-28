const express = require("express");
const router = express.Router();
const {
  createTank,
  getTanks,
  getTankById,
  updateTank,
  deleteTank
} = require("../controllers/BeNuoiController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect); // Tất cả route đều cần đăng nhập

router.post("/", createTank);
router.get("/", getTanks);
router.get("/:id", getTankById);
router.put("/:id", updateTank);
router.delete("/:id", deleteTank);

module.exports = router;
