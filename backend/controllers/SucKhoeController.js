const HealthLog = require("../models/SucKhoe");
const Medicine = require("../models/Thuoc"); // Import Model Thuốc để trừ kho
const Tank = require("../models/BeNuoi");      // Import Model Tank (nếu cần trừ số lượng lươn chết)

// 1. Tạo Health Log mới & Trừ kho thuốc
exports.createHealthLog = async (req, res) => {
  try {
    const { tankId, disease, medicine, medicineAmount, survivalRate, notes, recordedAt } = req.body;

    // --- LOGIC TRỪ KHO THUỐC ---
    if (medicine && medicineAmount > 0) {
      const medicineRecord = await Medicine.findById(medicine);
      
      // Kiểm tra thuốc có tồn tại không
      if (!medicineRecord) {
        return res.status(404).json({ message: "Loại thuốc này không tồn tại trong kho!" });
      }

      // Kiểm tra đủ số lượng không
      if (medicineRecord.currentStock < medicineAmount) {
        return res.status(400).json({ 
          message: `Không đủ thuốc! Kho chỉ còn ${medicineRecord.currentStock} ${medicineRecord.unit}.` 
        });
      }

      // Trừ kho và lưu lại
      medicineRecord.currentStock -= medicineAmount;
      await medicineRecord.save();
    }
    // ---------------------------

    const log = await HealthLog.create({ 
      tankId, 
      disease, 
      medicine: medicine || null, 
      medicineAmount: medicineAmount || 0, 
      survivalRate, 
      notes,
      recordedAt: recordedAt || Date.now()
    });

    res.status(201).json({ 
        message: "Ghi nhận sức khỏe thành công (Đã cập nhật kho thuốc)!", 
        data: log 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy danh sách Health Log (Kèm thông tin Bể và Thuốc)
exports.getHealthLogs = async (req, res) => {
  try {
    const logs = await HealthLog.find()
      .populate("tankId", "name")       // Lấy tên bể
      .populate("medicine", "name unit") // Lấy tên thuốc và đơn vị tính
      .sort({ recordedAt: -1 });        // Mới nhất lên đầu
      
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Lấy chi tiết 1 bản ghi
exports.getHealthLogById = async (req, res) => {
  try {
    const log = await HealthLog.findById(req.params.id)
        .populate("tankId", "name")
        .populate("medicine", "name unit");

    if (!log) return res.status(404).json({ message: "Bản ghi không tồn tại" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Cập nhật bản ghi
exports.updateHealthLog = async (req, res) => {
  try {
    // Lưu ý: Logic hoàn trả thuốc cũ và trừ thuốc mới khá phức tạp.
    // Ở mức độ đơn giản, ta chỉ cho phép cập nhật thông tin văn bản.
    // Nếu muốn sửa số lượng thuốc, tốt nhất là Xóa đi tạo lại.
    
    const log = await HealthLog.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
    );
    
    if (!log) return res.status(404).json({ message: "Bản ghi không tồn tại" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Xóa bản ghi (Có thể hoàn lại thuốc vào kho nếu cần)
exports.deleteHealthLog = async (req, res) => {
  try {
    const log = await HealthLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: "Bản ghi không tồn tại" });
    
    // --- LOGIC HOÀN KHO (TÙY CHỌN) ---
    // Nếu xóa bản ghi dùng thuốc, ta cộng lại số thuốc đó vào kho
    if (log.medicine && log.medicineAmount > 0) {
        const med = await Medicine.findById(log.medicine);
        if (med) {
            med.currentStock += log.medicineAmount;
            await med.save();
        }
    }
    // --------------------------------

    res.json({ message: "Xóa thành công (Đã hoàn lại thuốc vào kho)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};