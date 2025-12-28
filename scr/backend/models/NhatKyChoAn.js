const mongoose = require("mongoose");

const feedingLogSchema = new mongoose.Schema({
  // 1. Bể nuôi (Liên kết bảng Tank)
  tankId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tank", 
    required: [true, "Vui lòng chọn bể nuôi"] 
  },

  // 2. Loại thức ăn (Liên kết bảng Food)
  foodId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Food", 
    required: [true, "Vui lòng chọn loại thức ăn"] 
  },

  // 3. Số lượng cho ăn (kg)
  quantity: { 
    type: Number, 
    required: [true, "Vui lòng nhập lượng thức ăn"],
    min: 0
  },

  // 4. Chi phí thực tế (Quan trọng: Lưu cứng giá trị tiền tại thời điểm cho ăn)
  // Công thức: Số lượng * Giá nhập trung bình của thức ăn lúc đó
  estimatedCost: {
    type: Number,
    default: 0
  },
  
  // 5. Ngày giờ cho ăn
  feedingTime: { 
    type: Date, 
    default: Date.now 
  },

  // 6. Ghi chú
  notes: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

module.exports = mongoose.model("FeedingLog", feedingLogSchema);