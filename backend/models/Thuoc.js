const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  // 1. Tên thuốc (VD: Iodine, Vitamin C, Kháng sinh A...)
  name: { 
    type: String, 
    required: [true, "Tên thuốc không được để trống"], 
    trim: true 
  },

  // 2. Công dụng (Để dễ tìm kiếm khi lươn bị bệnh)
  usage: {
    type: String,
    trim: true,
    placeholder: "VD: Trị nấm, Sát khuẩn, Tăng đề kháng..."
  },

  // 3. Đơn vị tính (Quan trọng để quản lý kho)
  unit: {
    type: String,
    required: [true, "Vui lòng chọn đơn vị tính"],
    enum: ['ml', 'lít', 'g', 'kg', 'chai', 'gói', 'viên'], 
    default: 'chai'
  },

  // 4. Số lượng nhập (Lúc mua về)
  quantityImport: { 
    type: Number, 
    required: [true, "Số lượng nhập không được để trống"],
    min: 0
  },

  // 5. Tồn kho hiện tại (Biến động: Sẽ bị trừ khi sử dụng bên HealthLog)
  currentStock: {
    type: Number,
    required: true,
    default: function() { return this.quantityImport } // Mặc định ban đầu = số nhập
  },

  // 6. Giá nhập đơn vị (VD: 50.000đ / 1 chai)
  pricePerUnit: { 
    type: Number, 
    required: [true, "Giá nhập không được để trống"],
    min: 0
  },

  // 7. Tổng chi phí (Dùng cho báo cáo Tài chính)
  totalCost: {
    type: Number,
    required: true
  },

  // 8. Thông tin Người bán / Nguồn gốc
  supplierName: { type: String, trim: true }, // Tên người bán
  supplierPhone: { type: String, trim: true }, // SĐT người bán
  source: { type: String, trim: true },       // Nguồn nhập (Cửa hàng/Công ty)

  // 9. Thời gian
  importDate: { type: Date, default: Date.now }, // Ngày nhập
  expiryDate: { type: Date },                    // Hạn sử dụng (Nên có)

  // 10. Ghi chú
  notes: { type: String }

}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);