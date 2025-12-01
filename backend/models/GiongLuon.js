const mongoose = require("mongoose");

const seedBatchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  quantity: { 
    type: Number, 
    required: [true, "Phải nhập số lượng con để quản lý mật độ"], 
    min: 1 
  },
  sizeGrade: { 
    type: Number, 
    required: true 
  },
  pricePerUnit: { 
    type: Number, 
    required: true 
  },
  totalCost: { 
    type: Number, 
    required: true 
  },
  source: { 
    type: String, 
    trim: true 
  },
  tankId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tank", 
    required: true 
  },
  importDate: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model("SeedBatch", seedBatchSchema);