const mongoose = require("mongoose");

const healthLogSchema = new mongoose.Schema({
  // Liên kết với Bể nuôi
  tankId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tank", 
    required: true 
  },
  
  // Tên bệnh / Vấn đề sức khỏe
  disease: { 
    type: String, 
    trim: true 
  },

  // Liên kết với Kho Thuốc (Thay vì nhập tên thuốc thủ công)
  medicine: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Medicine", 
    default: null 
  },

  // Số lượng thuốc đã sử dụng (Để trừ kho)
  medicineAmount: { 
    type: Number, 
    default: 0,
    min: 0 
  },

  // Tỉ lệ sống sót (Hoặc số lượng chết, tùy cách bạn nhập)
  survivalRate: { 
    type: Number, 
    min: 0, 
    max: 100 
  },

  // Ghi chú thêm
  notes: { 
    type: String, 
    trim: true 
  },

  // Thời gian ghi nhận
  recordedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model("HealthLog", healthLogSchema);