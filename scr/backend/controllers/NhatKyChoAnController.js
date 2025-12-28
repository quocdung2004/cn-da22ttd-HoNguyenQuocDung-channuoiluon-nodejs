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
exports.updateFeedingLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { tankId, foodId, quantity, feedingTime, notes } = req.body;

    // 1. Tìm nhật ký cũ
    const log = await FeedingLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi nhật ký" });
    }

    // 2. Tìm loại thức ăn liên quan
    // (Giả sử người dùng không đổi loại thức ăn, chỉ sửa số lượng/ngày giờ. 
    // Nếu đổi loại thức ăn thì logic phức tạp hơn nhiều, ở đây ta tập trung vào đổi số lượng).
    const foodItem = await Food.findById(log.foodId);
    if (!foodItem) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thức ăn trong kho" });
    }

    // 3. Xử lý kho nếu số lượng thay đổi
    const newQuantity = Number(quantity);
    const oldQuantity = log.quantity;
    
    if (newQuantity !== oldQuantity) {
      const difference = newQuantity - oldQuantity; // Dương là ăn thêm, Âm là giảm bớt

      // Nếu ăn thêm (diff > 0), kiểm tra xem kho còn đủ để trừ thêm không
      if (difference > 0 && foodItem.currentStock < difference) {
        return res.status(400).json({ 
           message: `Kho không đủ để cập nhật tăng! Cần thêm ${difference} ${foodItem.unit}, nhưng kho chỉ còn ${foodItem.currentStock}.` 
        });
      }

      // Cập nhật tồn kho (Trừ đi phần chênh lệch)
      // Nếu diff > 0 (tăng ăn) -> Stock giảm
      // Nếu diff < 0 (giảm ăn) -> Stock tăng (hoàn lại)
      foodItem.currentStock -= difference;
      await foodItem.save();

      // Cập nhật lại chi phí theo số lượng mới
      log.estimatedCost = newQuantity * foodItem.pricePerUnit;
    }

    // 4. Cập nhật các thông tin khác
    log.quantity = newQuantity;
    if (tankId) log.tankId = tankId;
    if (feedingTime) log.feedingTime = feedingTime;
    if (notes) log.notes = notes;

    await log.save();

    res.status(200).json({ 
      message: "Cập nhật thành công (Đã điều chỉnh tồn kho)", 
      data: log 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};