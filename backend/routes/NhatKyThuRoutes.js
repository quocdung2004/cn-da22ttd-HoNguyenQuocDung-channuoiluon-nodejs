const express = require("express");
const router = express.Router();
const {
  createIncomeLog,
  getAllIncomeLogs,
  getIncomeLogsByTank,
  updateIncomeLog,
  deleteIncomeLog
} = require("../controllers/NhatKyThuController");

const { protect } = require("../middleware/authMiddleware");

// Bảo vệ tất cả các routes
router.use(protect);

// 1. Lấy tất cả & Tạo mới
router.route("/")
  .get(getAllIncomeLogs) // GET /api/income-logs
  .post(createIncomeLog); // POST /api/income-logs

// 2. Lấy theo từng bể
router.get("/tank/:tankId", getIncomeLogsByTank);

// 3. Sửa & Xóa theo ID
router.route("/:id")
  .put(updateIncomeLog)    // PUT /api/income-logs/:id
  .delete(deleteIncomeLog); // DELETE /api/income-logs/:id

module.exports = router;