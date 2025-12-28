const Environment = require("../models/MoiTruong");

// Tạo record môi trường
exports.createEnvironment = async (req, res) => {
  try {
    const { tankId, pH, temperature, oxygen, turbidity } = req.body;
    const record = await Environment.create({ tankId, pH, temperature, oxygen, turbidity });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả record
exports.getEnvironments = async (req, res) => {
  try {
    const records = await Environment.find().populate("tankId", "name type");
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy record theo ID
exports.getEnvironmentById = async (req, res) => {
  try {
    const record = await Environment.findById(req.params.id).populate("tankId", "name type");
    if (!record) return res.status(404).json({ message: "Record không tồn tại" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật record
exports.updateEnvironment = async (req, res) => {
  try {
    const record = await Environment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ message: "Record không tồn tại" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa record
exports.deleteEnvironment = async (req, res) => {
  try {
    const record = await Environment.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Record không tồn tại" });
    res.json({ message: "Xóa record thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
