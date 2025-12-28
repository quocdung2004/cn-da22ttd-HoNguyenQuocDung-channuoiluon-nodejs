const Tank = require("../models/BeNuoi"); // Đảm bảo đường dẫn model đúng

// Tạo bể mới
exports.createTank = async (req, res) => {
  try {
    // Khi tạo mới, ta chỉ cần các thông tin cơ bản.
    // Status mặc định là 'empty', currentQuantity là 0 (đã set default trong Model)
    const { name, size, location } = req.body;
    
    const tank = await Tank.create({ 
        name, 
        size, 
        location,
        // status, type, currentBatchId... sẽ nhận giá trị default từ Model
    });
    
    res.status(201).json(tank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách tất cả bể (QUAN TRỌNG: Cần Populate)
exports.getTanks = async (req, res) => {
  try {
    // .populate("currentBatchId", "name") nghĩa là:
    // "Hãy tìm trong bảng SeedBatch dựa theo currentBatchId,
    // và chỉ lấy trường 'name' của lô giống đó đắp vào đây."
    
    const tanks = await Tank.find()
      .populate("currentBatchId", "name"); 
      
    res.json(tanks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin 1 bể theo ID (Cũng cần Populate để xem chi tiết)
exports.getTankById = async (req, res) => {
  try {
    const tank = await Tank.findById(req.params.id)
      .populate("currentBatchId", "name");
      
    if (!tank) return res.status(404).json({ message: "Bể không tồn tại" });
    res.json(tank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật bể
exports.updateTank = async (req, res) => {
  try {
    // Chỉ cho phép sửa thông tin hạ tầng (Tên, Size, Vị trí)
    // Không nên cho sửa status hay số lượng ở đây (vì nó được quản lý tự động)
    const { name, size, location } = req.body;

    const tank = await Tank.findByIdAndUpdate(
        req.params.id, 
        { name, size, location }, 
        { new: true, runValidators: true }
    ).populate("currentBatchId", "name"); // Populate lại để trả về dữ liệu đầy đủ

    if (!tank) return res.status(404).json({ message: "Bể không tồn tại" });
    res.json(tank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa bể
exports.deleteTank = async (req, res) => {
  try {
    const tank = await Tank.findByIdAndDelete(req.params.id);
    if (!tank) return res.status(404).json({ message: "Bể không tồn tại" });
    res.json({ message: "Xóa bể thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};