const mongoose = require("mongoose");

const environmentSchema = new mongoose.Schema({
  tankId: { type: mongoose.Schema.Types.ObjectId, ref: "Tank", required: true },
  pH: { type: Number, required: true },
  temperature: { type: Number, required: true },
  oxygen: { type: Number, required: true },
  turbidity: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Environment", environmentSchema);
