const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// Đăng ký
router.post("/register", registerUser);

// Đăng nhập
router.post("/login", loginUser);

// Lấy thông tin user (cần token)
router.get("/profile", protect, getUserProfile);

module.exports = router;
