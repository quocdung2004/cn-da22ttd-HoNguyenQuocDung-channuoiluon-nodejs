const SpendingLog = require("../models/NhatKyChi");

// 1. Tạo phiếu chi mới (CÓ CẬP NHẬT)
exports.createSpendingLog = async (req, res) => {
  try {
    const { tankId, reason, totalCost, note, date } = req.body;

    // --- LOGIC QUAN TRỌNG: XỬ LÝ TANK ID ---
    // Nếu tankId là chuỗi rỗng "" hoặc undefined -> Gán là null (Chi phí chung)
    // Nếu có tankId -> Giữ nguyên
    const tankRef = (tankId && tankId !== "") ? tankId : null;

    const newLog = await SpendingLog.create({
      tankId: tankRef,
      reason,
      totalCost,
      note,
      date: date || Date.now()
    });

    res.status(201).json({
      message: "Tạo phiếu chi thành công",
      data: newLog
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2. Lấy tất cả phiếu chi (GIỮ NGUYÊN)
exports.getAllSpendingLogs = async (req, res) => {
  try {
    const logs = await SpendingLog.find()
      .populate("tankId", "name") // Nếu tankId là null, populate sẽ trả về null (không lỗi)
      .sort({ date: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lấy phiếu chi theo ID Bể (GIỮ NGUYÊN)
exports.getSpendingLogsByTank = async (req, res) => {
  try {
    const { tankId } = req.params;
    
    const logs = await SpendingLog.find({ tankId })
      .sort({ date: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Cập nhật phiếu chi (CÓ CẬP NHẬT NHẸ)
exports.updateSpendingLog = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Xử lý tankId tương tự như lúc tạo mới
    const updateData = { ...req.body };
    if (updateData.tankId === "") {
        updateData.tankId = null;
    }

    const updatedLog = await SpendingLog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedLog) {
      return res.status(404).json({ message: "Phiếu chi không tồn tại" });
    }

    res.status(200).json({
      message: "Cập nhật thành công",
      data: updatedLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Xóa phiếu chi (GIỮ NGUYÊN)
exports.deleteSpendingLog = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLog = await SpendingLog.findByIdAndDelete(id);

    if (!deletedLog) {
      return res.status(404).json({ message: "Phiếu chi không tồn tại" });
    }

    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};