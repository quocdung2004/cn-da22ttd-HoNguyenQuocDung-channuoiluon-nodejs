// models/NhatKyChi.js (SpendingLog)
const mongoose = require("mongoose");

const spendingLogSchema = new mongoose.Schema({
  // 1. Tên bể nuôi (Liên kết tới bảng Tank)
  tankId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tank", 
    default: null // Cho phép null nếu là thu nhập chung
  },

  // 2. Lí do chi (Ví dụ: Sửa máy bơm, Mua ống nước, Thay bạt...)
  reason: { 
    type: String, 
    required: [true, "Vui lòng nhập lí do chi"], 
    trim: true 
  },

  // 3. Tổng chi phí (VNĐ)
  totalCost: { 
    type: Number, 
    required: [true, "Vui lòng nhập tổng chi phí"],
    min: [0, "Chi phí không được là số âm"]
  },

  // 4. Ghi chú thêm
  note: { 
    type: String, 
    trim: true 
  },

  // 5. Ngày chi (Mặc định là hiện tại, nhưng có thể chọn lại ngày cũ)
  date: { 
    type: Date, 
    default: Date.now 
  }

}, { timestamps: true });

module.exports = mongoose.model("SpendingLog", spendingLogSchema);