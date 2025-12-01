const mongoose = require("mongoose");

const tankSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Tên bể không được để trống"], 
    trim: true 
  },

  // ⚠️ ĐÃ SỬA: Loại lươn không còn bắt buộc (required) nữa.
  // Nó sẽ được Controller tự động cập nhật khi bạn thả giống vào.
  // Mặc định là chuỗi rỗng hoặc "Trống".
  type: { 
    type: String, 
    default: "" 
  },

  size: { 
    type: Number, 
    required: [true, "Dung tích bể không được để trống"] 
  },

  location: { 
    type: String, 
    trim: true 
  },

  // --- CÁC TRƯỜNG BỔ SUNG ĐỂ QUẢN LÝ QUY TRÌNH ---

  // Trạng thái bể: 'empty' (Trống) hoặc 'raising' (Đang nuôi)
  status: { 
    type: String, 
    enum: ['empty', 'raising'], 
    default: 'empty' 
  },

  // Liên kết với Lô Giống (để biết giống nhập ngày nào, nguồn gốc ở đâu)
  currentBatchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SeedBatch", 
    default: null 
  },

  // Số lượng con hiện tại (Sẽ bị trừ dần khi nhập HealthLog chết hoặc Harvest bán)
  currentQuantity: { 
    type: Number, 
    default: 0 
  },

  // Số lượng ban đầu thả vào (Để tính tỉ lệ sống)
  startQuantity: {
    type: Number,
    default: 0
  },

  // Ngày bắt đầu thả nuôi
  startDate: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model("Tank", tankSchema);