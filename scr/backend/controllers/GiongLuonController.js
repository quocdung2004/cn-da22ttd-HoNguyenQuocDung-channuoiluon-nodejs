const SeedBatch = require("../models/GiongLuon");
const Tank = require("../models/BeNuoi");

exports.createSeedBatch = async (req, res) => {
  try {
    const { tankId, quantity, ...otherData } = req.body;

    // Log dữ liệu nhận được để debug
    console.log("Create SeedBatch Data:", req.body);

    const tank = await Tank.findById(tankId);
    if (!tank) return res.status(404).json({ message: "Bể không tồn tại" });
    
    if (tank.status === 'raising') {
        return res.status(400).json({ message: "Bể này đang nuôi, vui lòng chọn bể trống hoặc xuất bán trước!" });
    }

    // --- XỬ LÝ DỮ LIỆU THIẾU (Tránh lỗi 500) ---
    // Tự tính giá đơn vị nếu thiếu (Lấy Tổng chi phí / Số lượng)
    const pricePerUnit = otherData.pricePerUnit || (quantity > 0 ? (otherData.totalCost / quantity) : 0);
    // Mặc định sizeGrade là 0 nếu không nhập (để qua được validation của Model)
    const sizeGrade = otherData.sizeGrade || 0; 

    const newBatch = await SeedBatch.create({
      tankId,
      quantity,
      pricePerUnit,
      sizeGrade,
      ...otherData
    });

    tank.status = 'raising';
    tank.currentBatchId = newBatch._id;
    tank.currentQuantity = quantity;
    tank.startQuantity = quantity;
    tank.startDate = otherData.importDate || Date.now();
    
    await tank.save();

    res.status(201).json({ message: "Nhập giống thành công!", data: newBatch });

  } catch (error) {
    console.error("Lỗi tạo giống:", error); // In lỗi ra terminal để dễ sửa
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSeedBatches = async (req, res) => {
  try {
    const batches = await SeedBatch.find()
      .populate("tankId", "name")
      .sort({ importDate: -1 });

    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSeedBatchById = async (req, res) => {
  try {
    const batch = await SeedBatch.findById(req.params.id).populate("tankId", "name");
    if (!batch) return res.status(404).json({ message: "Lô giống không tồn tại" });
    
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSeedBatch = async (req, res) => {
  try {
    const updatedBatch = await SeedBatch.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedBatch) return res.status(404).json({ message: "Lô giống không tồn tại" });

    res.status(200).json({ message: "Cập nhật thành công", data: updatedBatch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSeedBatch = async (req, res) => {
  try {
    const batch = await SeedBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Lô giống không tồn tại" });

    const tank = await Tank.findById(batch.tankId);
    if (tank && tank.currentBatchId && tank.currentBatchId.toString() === batch._id.toString()) {
        tank.status = 'empty';
        tank.currentBatchId = null;
        tank.currentQuantity = 0;
        tank.startQuantity = 0;
        await tank.save();
    }

    await batch.deleteOne();

    res.status(200).json({ message: "Đã xóa lô giống và reset trạng thái bể nuôi!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};