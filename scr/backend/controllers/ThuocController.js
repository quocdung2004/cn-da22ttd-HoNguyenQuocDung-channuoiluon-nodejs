const Medicine = require("../models/Thuoc");

// 1. Nhập thuốc mới
exports.createMedicine = async (req, res) => {
  try {
    let { 
      name, usage, unit, quantityImport, pricePerUnit, 
      supplierName, supplierPhone, source, expiryDate, notes 
    } = req.body;

    // Tính tổng tiền tự động nếu Frontend không gửi lên
    // (Phòng trường hợp bạn chỉ nhập số lượng và đơn giá)
    let totalCost = req.body.totalCost;
    if (!totalCost && quantityImport && pricePerUnit) {
        totalCost = quantityImport * pricePerUnit;
    }

    const newMedicine = await Medicine.create({
      name,
      usage,
      unit,
      quantityImport, // Số nhập vào
      currentStock: quantityImport, // Mới nhập thì tồn kho = số nhập
      pricePerUnit,
      totalCost,      // Quan trọng cho Tài chính
      supplierName,
      supplierPhone,
      source,
      expiryDate,
      notes
    });

    res.status(201).json({ 
        message: "Nhập kho thuốc thành công!", 
        data: newMedicine 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy danh sách tất cả thuốc
exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ importDate: -1 }); // Mới nhất lên đầu
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lấy chi tiết 1 loại thuốc
exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Thuốc không tồn tại" });
    
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Cập nhật thông tin thuốc
exports.updateMedicine = async (req, res) => {
  try {
    const { quantityImport, pricePerUnit } = req.body;
    
    // Logic tính lại tổng tiền nếu người dùng sửa số lượng hoặc giá
    let updateData = { ...req.body };
    
    if (quantityImport && pricePerUnit) {
        updateData.totalCost = quantityImport * pricePerUnit;
    }

    // Lưu ý: Nếu bạn sửa quantityImport ở đây, 
    // logic đúng là phải xem xét có reset currentStock hay không.
    // Ở mức độ đơn giản, ta giả định update là sửa sai thông tin nhập liệu
    if (quantityImport) {
        // Nếu sửa số lượng nhập, ta cập nhật lại tồn kho tương ứng
        // (Đây là logic đơn giản hóa, thực tế phức tạp hơn nếu thuốc đã dùng rồi)
        updateData.currentStock = quantityImport; 
    }

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedMedicine) return res.status(404).json({ message: "Thuốc không tồn tại" });

    res.status(200).json({ message: "Cập nhật thành công", data: updatedMedicine });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Xóa thuốc
exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Thuốc không tồn tại" });
    
    res.status(200).json({ message: "Đã xóa thuốc khỏi kho" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. (Tính năng phụ) Lấy danh sách thuốc sắp hết hàng
exports.getLowStockMedicines = async (req, res) => {
  try {
    // Tìm những thuốc có tồn kho nhỏ hơn 5
    const lowStockMedicines = await Medicine.find({ currentStock: { $lt: 5 } });
    res.status(200).json(lowStockMedicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};