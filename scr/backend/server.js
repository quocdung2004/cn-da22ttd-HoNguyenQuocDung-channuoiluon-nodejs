// 1. Load env variables ĐẦU TIÊN (Rất quan trọng)
const dotenv = require('dotenv');
dotenv.config(); 

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Import Routes
const beNuoiRoutes = require('./routes/BeNuoiRoutes');
const MoiTruong = require('./routes/MoiTruongRoutes');
const SucKhoe = require('./routes/SucKhoeRoutes');
const GiongLuon = require('./routes/GiongLuonRoutes');
const Thuoc = require('./routes/ThuocRoutes');
const ThucAn = require('./routes/ThucAnRoutes');
const NhatKyChoAn = require('./routes/NhatKyChoAnRoutes');
const ChiPhiVanHanh = require('./routes/ChiPhiVanHanhRoutes');
const XuatBan = require('./routes/XuatBanRoutes');
const AIRoute = require('./routes/AIRoutes');

// Connect Database
connectDB();

const app = express();

// ===== MIDDLEWARES =====
app.use(express.json()); // parse JSON
app.use(cors());         // enable CORS
app.use(morgan('dev'));  // logging
app.use(helmet());       // bảo mật headers

// ===== ROUTES =====
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tank', beNuoiRoutes);
app.use('/api/MoiTruong', MoiTruong);
app.use('/api/SucKhoe', SucKhoe);
app.use('/api/GiongLuon', GiongLuon);
app.use('/api/Thuoc', Thuoc);
app.use('/api/ThucAn', ThucAn);
app.use('/api/NhatKyChoAn', NhatKyChoAn);
app.use('/api/ChiPhiVanHanh', ChiPhiVanHanh);
app.use('/api/XuatBan', XuatBan);
app.use('/api/ai', AIRoute);

// ===== 404 - route không tồn tại =====
app.use((req, res, next) => {
  res.status(404).json({ message: "Route không tồn tại" });
});

// ===== Error handling middleware =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server lỗi", error: err.message });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});