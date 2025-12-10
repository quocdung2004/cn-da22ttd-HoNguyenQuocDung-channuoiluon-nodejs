const mongoose = require("mongoose");

const harvestSchema = new mongoose.Schema({
  // 1. Bán từ bể nào
  tankId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tank", 
    required: [true, "Vui lòng chọn bể cần bán"] 
  },

  // 2. Thông tin người mua
  buyerName: { type: String, trim: true, default: "Khách lẻ" },
  buyerPhone: { type: String, trim: true },

  // 3. Ngày bán
  saleDate: { type: Date, default: Date.now },

  // 4. Chi tiết phân loại (Loại 1, Loại 2...)
  // Phần này giúp bạn thống kê: Vụ này được bao nhiêu % lươn loại 1?
  details: [
    {
      grade: { type: String, default: "Xô" }, // VD: Loại 1, Loại 2, Xô (lộn xộn)
      weight: { type: Number, required: true }, // Số kg
      price: { type: Number, required: true },  // Giá 1kg
      subtotal: { type: Number } // Thành tiền = weight * price
    }
  ],

  // 5. Tổng hợp (Quan trọng cho Tài chính)
  totalWeight: { 
    type: Number, 
    required: true 
  },

  totalRevenue: { 
    type: Number, 
    required: true 
  },

  // 6. Số lượng con xuất đi (Để trừ tồn kho trong bể)
  // Thương lái mua theo kg, nhưng bạn cần ước lượng số con để trừ kho
  quantitySold: {
    type: Number,
    required: [true, "Cần nhập ước lượng số con để cập nhật lại bể"],
    min: 1
  },

  // 7. Trạng thái: Đây có phải là đợt bán cuối cùng (Tát ao) không?
  // Nếu true -> Hệ thống sẽ tự động set bể về trạng thái 'empty' (Trống)
  isFinalHarvest: {
    type: Boolean,
    default: false
  },

  notes: { type: String }

}, { timestamps: true });

module.exports = mongoose.model("Harvest", harvestSchema);