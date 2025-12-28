const mongoose = require("mongoose");

const operationalExpenseSchema = new mongoose.Schema({
  // 1. Tên khoản chi (VD: Tiền điện tháng 10, Sửa máy bơm...)
  name: { 
    type: String, 
    required: [true, "Vui lòng nhập tên khoản chi"], 
    trim: true 
  },

  // 2. Phân loại chi phí (Đã chuyển sang tiếng Việt)
  type: {
    type: String,
    required: [true, "Vui lòng chọn loại chi phí"],
    // Lưu trực tiếp tiếng Việt để dễ đọc và hiển thị
    enum: ['Tiền điện', 'Tiền nước', 'Vận chuyển', 'Nhân công', 'Bảo trì', 'Khác'],
    default: 'Khác'
  },

  // 3. Số tiền chi
  amount: { 
    type: Number, 
    required: [true, "Vui lòng nhập số tiền"],
    min: 0
  },

  // 4. Ngày chi
  date: { 
    type: Date, 
    default: Date.now 
  },

  // 5. Người chi tiền (Optional)
  payer: { 
    type: String, 
    trim: true 
  },

  // 6. Chi cho bể nào? (Optional)
  relatedTankId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tank", 
    default: null 
  },

  // 7. Ghi chú
  note: { 
    type: String, 
    trim: true 
  }

}, { timestamps: true });

module.exports = mongoose.model("OperationalExpense", operationalExpenseSchema);