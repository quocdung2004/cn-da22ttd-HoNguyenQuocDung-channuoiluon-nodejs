const express = require("express");
const router = express.Router();
const {
  createHealthLog,
  getHealthLogs,
  getHealthLogById,
  updateHealthLog,
  deleteHealthLog
} = require("../controllers/SucKhoeController");

const { protect } = require("../middleware/authMiddleware");

// Bảo vệ tất cả các routes (Yêu cầu đăng nhập)
router.use(protect);

router.route("/")
  .post(createHealthLog) // Tạo mới
  .get(getHealthLogs);   // Lấy danh sách

router.route("/:id")
  .get(getHealthLogById)    // Xem chi tiết
  .put(updateHealthLog)     // Cập nhật
  .delete(deleteHealthLog); // Xóa

module.exports = router;