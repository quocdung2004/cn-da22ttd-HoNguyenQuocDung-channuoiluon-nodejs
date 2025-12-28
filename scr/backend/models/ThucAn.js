const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  // 1. Tên thức ăn (VD: Cám Cargill 40 đạm, Trùn quế...)
  name: { 
    type: String, 
    required: [true, "Tên thức ăn không được để trống"], 
    trim: true 
  },

  // 2. Loại thức ăn (Phân loại để quản lý)
  type: {
    type: String,
    required: true,
    enum: ['viên nổi', 'viên chìm', 'bột', 'tươi sống', 'khác'],
    default: 'viên nổi'
  },

  // 3. Độ đạm (% Protein) - Chỉ số quan trọng của cám lươn
  protein: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // 4. Đơn vị tính (kg, bao, tấn...)
  // Khuyên dùng: Nên quy đổi ra 'kg' để dễ trừ kho khi cho ăn
  unit: {
    type: String,
    required: true,
    default: 'kg'
  },

  // 5. Số lượng nhập
  quantityImport: { 
    type: Number, 
    required: [true, "Số lượng nhập không được để trống"],
    min: 0
  },

  // 6. Tồn kho hiện tại (Sẽ bị trừ dần khi viết Nhật ký cho ăn)
  currentStock: {
    type: Number,
    required: true,
    default: function() { return this.quantityImport }
  },

  // 7. Giá nhập đơn vị
  pricePerUnit: { 
    type: Number, 
    required: [true, "Giá nhập không được để trống"],
    min: 0
  },

  // 8. Tổng chi phí (Tự động tính vào Chi phí Tài chính)
  totalCost: {
    type: Number,
    required: true
  },

  // 9. Thông tin Nguồn gốc
  supplierName: { type: String, trim: true },
  supplierPhone: { type: String, trim: true },
  source: { type: String, trim: true },

  // 10. Thời gian
  importDate: { type: Date, default: Date.now },
  expiryDate: { type: Date }, // Hạn sử dụng

  // 11. Ghi chú
  notes: { type: String }

}, { timestamps: true });

module.exports = mongoose.model("Food", foodSchema);