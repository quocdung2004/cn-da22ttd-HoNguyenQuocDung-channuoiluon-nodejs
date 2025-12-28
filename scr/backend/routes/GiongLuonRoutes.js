const express = require("express");
const router = express.Router();
const {
  createSeedBatch,
  getAllSeedBatches,
  getSeedBatchById,
  updateSeedBatch,
  deleteSeedBatch
} = require("../controllers/GiongLuonController"); // Đảm bảo tên file controller đúng

const { protect } = require("../middleware/authMiddleware");

// Bảo vệ tất cả các route (yêu cầu đăng nhập)
router.use(protect);

// Đường dẫn gốc: /api/seed-batches
router.route("/")
  .post(createSeedBatch)      // Tạo lô giống mới
  .get(getAllSeedBatches);    // Lấy danh sách tất cả lô giống

// Đường dẫn có ID: /api/seed-batches/:id
router.route("/:id")
  .get(getSeedBatchById)      // Xem chi tiết 1 lô
  .put(updateSeedBatch)       // Cập nhật thông tin lô
  .delete(deleteSeedBatch);   // Xóa lô giống

module.exports = router;