const Food = require("../models/ThucAn");

// 1. Nhập kho thức ăn
exports.createFood = async (req, res) => {
  try {
    let { 
      name, type, protein, unit, quantityImport, pricePerUnit, 
      supplierName, supplierPhone, source, expiryDate, notes, importDate 
    } = req.body;

    // Tự động tính tổng tiền nếu thiếu
    let totalCost = req.body.totalCost;
    if (!totalCost && quantityImport && pricePerUnit) {
        totalCost = quantityImport * pricePerUnit;
    }

    const newFood = await Food.create({
      name, type, protein, unit,
      quantityImport,
      currentStock: quantityImport, // Ban đầu tồn kho = nhập
      pricePerUnit,
      totalCost,
      supplierName, supplierPhone, source,
      expiryDate,
      importDate: importDate || Date.now(),
      notes
    });

    res.status(201).json({ message: "Nhập kho thức ăn thành công!", data: newFood });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy danh sách thức ăn
exports.getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find().sort({ importDate: -1 });
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lấy chi tiết
exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: "Thức ăn không tồn tại" });
    res.status(200).json(food);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Cập nhật
exports.updateFood = async (req, res) => {
  try {
    const { quantityImport, pricePerUnit } = req.body;
    let updateData = { ...req.body };

    // Tính lại tổng tiền nếu có thay đổi số lượng/giá
    if (quantityImport && pricePerUnit) {
        updateData.totalCost = quantityImport * pricePerUnit;
    }
    // Nếu sửa số lượng nhập, reset lại tồn kho (Logic đơn giản)
    if (quantityImport) {
        updateData.currentStock = quantityImport;
    }

    const updatedFood = await Food.findByIdAndUpdate(
      req.params.id, updateData, { new: true, runValidators: true }
    );

    if (!updatedFood) return res.status(404).json({ message: "Thức ăn không tồn tại" });
    res.status(200).json({ message: "Cập nhật thành công", data: updatedFood });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Xóa
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: "Thức ăn không tồn tại" });
    res.status(200).json({ message: "Đã xóa thức ăn khỏi kho" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};