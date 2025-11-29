const IncomeLog = require("../models/NhatKyThu");

// 1. Tạo phiếu thu mới
exports.createIncomeLog = async (req, res) => {
  try {
    const { tankId, source, totalIncome, note, date } = req.body;

    const newLog = await IncomeLog.create({
      tankId: tankId || null, // Nếu không chọn bể thì để null (thu nhập chung)
      source,
      totalIncome,
      note,
      date: date || Date.now()
    });

    res.status(201).json({
      message: "Tạo phiếu thu thành công",
      data: newLog
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2. Lấy tất cả phiếu thu (Sắp xếp mới nhất trước)
exports.getAllIncomeLogs = async (req, res) => {
  try {
    const logs = await IncomeLog.find()
      .populate("tankId", "name") // Hiện tên bể nếu có
      .sort({ date: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lấy phiếu thu theo ID Bể (Để tính tài chính cho từng bể)
exports.getIncomeLogsByTank = async (req, res) => {
  try {
    const { tankId } = req.params;
    
    const logs = await IncomeLog.find({ tankId })
      .sort({ date: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Cập nhật phiếu thu
exports.updateIncomeLog = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLog = await IncomeLog.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedLog) {
      return res.status(404).json({ message: "Phiếu thu không tồn tại" });
    }

    res.status(200).json({
      message: "Cập nhật thành công",
      data: updatedLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Xóa phiếu thu
exports.deleteIncomeLog = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLog = await IncomeLog.findByIdAndDelete(id);

    if (!deletedLog) {
      return res.status(404).json({ message: "Phiếu thu không tồn tại" });
    }

    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};