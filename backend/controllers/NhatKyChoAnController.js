const FeedingLog = require("../models/NhatKyChoAn");
const Food = require("../models/ThucAn");
const Tank = require("../models/BeNuoi");

// 1. Tạo nhật ký ăn & Trừ kho & Tính tiền
exports.createFeedingLog = async (req, res) => {
  try {
    const { tankId, foodId, quantity, feedingTime, notes } = req.body;

    // A. Kiểm tra Thức ăn trong kho
    const foodItem = await Food.findById(foodId);
    if (!foodItem) {
      return res.status(404).json({ message: "Loại thức ăn này không tồn tại!" });
    }

    // B. Kiểm tra tồn kho
    if (foodItem.currentStock < quantity) {
      return res.status(400).json({ 
        message: `Kho không đủ! Chỉ còn ${foodItem.currentStock} ${foodItem.unit}.` 
      });
    }

    // C. TÍNH TIỀN (Quan trọng cho báo cáo tài chính)
    // Lấy số lượng * giá nhập đơn vị hiện tại của thức ăn
    const cost = quantity * foodItem.pricePerUnit;

    // D. Tạo bản ghi Nhật ký
    const newLog = await FeedingLog.create({
      tankId,
      foodId,
      quantity,
      estimatedCost: cost, // Lưu lại số tiền này mãi mãi
      feedingTime: feedingTime || Date.now(),
      notes
    });

    // E. TRỪ KHO & LƯU LẠI
    foodItem.currentStock -= quantity;
    await foodItem.save();

    res.status(201).json({ 
        message: "Cho ăn thành công (Đã trừ kho & tính chi phí)!", 
        data: newLog 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy danh sách (Populate đầy đủ để hiển thị)
exports.getAllFeedingLogs = async (req, res) => {
  try {
    const logs = await FeedingLog.find()
      .populate("tankId", "name")        
      .populate("foodId", "name unit pricePerUnit") 
      .sort({ feedingTime: -1 });
      
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lấy theo Bể (Dùng cho trang Chi tiết Bể hoặc Tài chính từng bể)
exports.getFeedingLogsByTank = async (req, res) => {
  try {
    const { tankId } = req.params;
    const logs = await FeedingLog.find({ tankId })
      .populate("foodId", "name unit")
      .sort({ feedingTime: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Xóa nhật ký (Hoàn lại kho)
exports.deleteFeedingLog = async (req, res) => {
  try {
    const log = await FeedingLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Không tìm thấy bản ghi" });

    // Hoàn lại số lượng vào kho
    const foodItem = await Food.findById(log.foodId);
    if (foodItem) {
        foodItem.currentStock += log.quantity;
        await foodItem.save();
    }

    await log.deleteOne();
    res.status(200).json({ message: "Đã xóa và hoàn lại thức ăn vào kho!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};