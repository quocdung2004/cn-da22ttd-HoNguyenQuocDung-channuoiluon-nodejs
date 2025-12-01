const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const beNuoiRoutes = require('./routes/BeNuoiRoutes');
const MoiTruong = require('./routes/MoiTruongRoutes');
const NhatKyChi = require('./routes/NhatKyChiRoutes');
const SucKhoe = require('./routes/SucKhoeRoutes');
const NhatKyThu = require('./routes/NhatKyThuRoutes');
const GiongLuon = require('./routes/GiongLuonRoutes');
// Load env variables
dotenv.config();
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
app.use('/api/NhatKyChi', NhatKyChi);
app.use('/api/NhatKyThu', NhatKyThu);
app.use('/api/SucKhoe', SucKhoe);
app.use('/api/GiongLuon',GiongLuon);
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
