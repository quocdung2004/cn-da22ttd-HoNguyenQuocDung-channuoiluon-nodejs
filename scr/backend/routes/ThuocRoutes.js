const express = require("express");
const router = express.Router();
const {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines
} = require("../controllers/ThuocController");

const { protect } = require("../middleware/authMiddleware");

// Bảo vệ tất cả các route (Yêu cầu đăng nhập mới được thao tác)
router.use(protect);

// --- CÁC ROUTES ĐẶC BIỆT (Phải đặt TRƯỚC route có :id) ---

// Lấy danh sách thuốc sắp hết hàng (tồn kho < 5)
// GET /api/medicines/low-stock
router.get("/low-stock", getLowStockMedicines);


// --- CÁC ROUTES CƠ BẢN ---

// Gốc: /api/medicines
router.route("/")
  .get(getAllMedicines)      // Xem danh sách tất cả thuốc
  .post(createMedicine);     // Nhập thuốc mới vào kho

// Theo ID: /api/medicines/:id
router.route("/:id")
  .get(getMedicineById)      // Xem chi tiết 1 loại thuốc
  .put(updateMedicine)       // Cập nhật thông tin thuốc
  .delete(deleteMedicine);   // Xóa thuốc khỏi kho

module.exports = router;

