const mongoose = require("mongoose");

const incomeLogSchema = new mongoose.Schema({
  // 1. Tên bể nuôi (Liên kết tới bảng Tank - Nếu khoản thu này gắn với bể cụ thể)
  // Nếu khoản thu chung cho cả trại (không thuộc bể nào), trường này có thể null
  tankId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tank",
    default: null // Cho phép null nếu là thu nhập chung
  },

  // 2. Lí do thu (Ví dụ: Bán bao cám cũ, Thanh lý máy bơm, Bán phân...)
  source: { 
    type: String, 
    required: [true, "Vui lòng nhập nguồn thu/lí do thu"], 
    trim: true 
  },

  // 3. Tổng số tiền thu (VNĐ)
  totalIncome: { 
    type: Number, 
    required: [true, "Vui lòng nhập tổng số tiền thu"],
    min: [0, "Số tiền thu không được là số âm"]
  },

  // 4. Ghi chú thêm
  note: { 
    type: String, 
    trim: true 
  },

  // 5. Ngày thu (Mặc định là hiện tại)
  date: { 
    type: Date, 
    default: Date.now 
  }

}, { timestamps: true });

module.exports = mongoose.model("IncomeLog", incomeLogSchema);