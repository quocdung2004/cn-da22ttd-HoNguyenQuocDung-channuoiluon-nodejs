const Harvest = require("../models/XuatBan");
const Tank = require("../models/BeNuoi");

// 1. Tạo phiếu xuất bán mới & Cập nhật Bể
exports.createHarvest = async (req, res) => {
  try {
    const { 
      tankId, buyerName, buyerPhone, saleDate, 
      details, quantitySold, isFinalHarvest, notes 
    } = req.body;

    // A. Tính toán tổng trọng lượng và tổng tiền từ chi tiết (nếu có)
    let totalWeight = 0;
    let totalRevenue = 0;

    if (details && details.length > 0) {
      details.forEach(item => {
        const subtotal = item.weight * item.price;
        item.subtotal = subtotal; // Lưu lại thành tiền từng món
        totalWeight += Number(item.weight);
        totalRevenue += subtotal;
      });
    } else {
      // Nếu người dùng nhập tổng trực tiếp (không nhập chi tiết)
      totalWeight = Number(req.body.totalWeight) || 0;
      totalRevenue = Number(req.body.totalRevenue) || 0;
    }

    // B. Tạo bản ghi Xuất Bán
    const newHarvest = await Harvest.create({
      tankId,
      buyerName,
      buyerPhone,
      saleDate: saleDate || Date.now(),
      details,
      totalWeight,
      totalRevenue,
      quantitySold, // Số lượng con ước tính bán ra
      isFinalHarvest,
      notes
    });

    // C. CẬP NHẬT TRẠNG THÁI BỂ (QUAN TRỌNG)
    const tank = await Tank.findById(tankId);
    if (tank) {
      if (isFinalHarvest) {
        // C1. Nếu là Tát ao (Bán hết) -> Reset bể về trống
        tank.status = 'empty';
        tank.currentBatchId = null;
        tank.currentQuantity = 0;
        tank.startQuantity = 0; // Reset mốc
        tank.startDate = null;
      } else {
        // C2. Nếu là Bán tỉa -> Chỉ trừ số lượng
        tank.currentQuantity = tank.currentQuantity - quantitySold;
        if (tank.currentQuantity < 0) tank.currentQuantity = 0; // Không để âm
      }
      await tank.save();
    }

    res.status(201).json({ 
      message: isFinalHarvest ? "Đã xuất bán và chốt ao thành công!" : "Đã xuất bán tỉa thành công!",
      data: newHarvest 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy danh sách lịch sử bán
exports.getAllHarvests = async (req, res) => {
  try {
    const harvests = await Harvest.find()
      .populate("tankId", "name")
      .sort({ saleDate: -1 }); // Mới nhất lên đầu

    res.status(200).json(harvests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lấy lịch sử bán theo Bể
exports.getHarvestsByTank = async (req, res) => {
  try {
    const { tankId } = req.params;
    const harvests = await Harvest.find({ tankId }).sort({ saleDate: -1 });
    res.status(200).json(harvests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Xóa phiếu bán (Cẩn thận: Cần cân nhắc có hoàn lại số lượng vào bể không)
exports.deleteHarvest = async (req, res) => {
  try {
    const harvest = await Harvest.findById(req.params.id);
    if (!harvest) return res.status(404).json({ message: "Phiếu không tồn tại" });

    // Logic hoàn lại số lượng vào bể (nếu bể đó vẫn đang nuôi)
    // Nếu bể đã reset 'empty' rồi thì việc cộng lại hơi phức tạp, ở đây ta chỉ cộng nếu bể đang 'raising'
    const tank = await Tank.findById(harvest.tankId);
    if (tank && tank.status === 'raising') {
        tank.currentQuantity += harvest.quantitySold;
        await tank.save();
    }

    await harvest.deleteOne();
    res.status(200).json({ message: "Xóa thành công (Đã hoàn lại số lượng nếu bể đang nuôi)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateHarvest = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantitySold, isFinalHarvest, ...otherData } = req.body;

    // 1. Tìm phiếu cũ để lấy số liệu cũ
    const oldHarvest = await Harvest.findById(id);
    if (!oldHarvest) return res.status(404).json({ message: "Phiếu bán không tồn tại" });

    // 2. Tìm bể liên quan
    const tank = await Tank.findById(oldHarvest.tankId);

    // 3. Xử lý logic kho nếu có thay đổi số lượng hoặc trạng thái
    if (tank && tank.status === 'raising') { // Chỉ chỉnh sửa kho nếu bể đang nuôi
        
        // A. Hoàn lại số lượng cũ vào bể
        tank.currentQuantity += oldHarvest.quantitySold;

        // B. Trừ số lượng mới
        const newQuantitySold = quantitySold !== undefined ? Number(quantitySold) : oldHarvest.quantitySold;
        tank.currentQuantity -= newQuantitySold;

        // Đảm bảo không âm
        if (tank.currentQuantity < 0) tank.currentQuantity = 0;
        
        // C. Xử lý Tát ao (Nếu sửa thành Tát ao)
        const newIsFinal = isFinalHarvest !== undefined ? isFinalHarvest : oldHarvest.isFinalHarvest;
        if (newIsFinal) {
            tank.status = 'empty';
            tank.currentBatchId = null;
            tank.currentQuantity = 0;
        }

        await tank.save();
    }

    // 4. Cập nhật phiếu bán
    const updatedHarvest = await Harvest.findByIdAndUpdate(
      id, 
      { quantitySold, isFinalHarvest, ...otherData }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Cập nhật thành công!", data: updatedHarvest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
