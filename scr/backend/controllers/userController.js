const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Hàm tạo token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "secretkey", {
    expiresIn: "7d"
  });
};

// -------------------- Đăng ký --------------------
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được đăng ký" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Đăng nhập --------------------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Lấy thông tin user --------------------
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // req.user được set bởi middleware protect
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
