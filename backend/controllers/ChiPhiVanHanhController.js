const OperationalExpense = require("../models/ChiPhiVanHanh");

// 1. Tạo chi phí mới
exports.createExpense = async (req, res) => {
  try {
    // Xử lý relatedTankId: nếu rỗng thì set null
    const expenseData = { ...req.body };
    if (!expenseData.relatedTankId) expenseData.relatedTankId = null;

    const newExpense = await OperationalExpense.create(expenseData);
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy danh sách (Mới nhất lên đầu)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await OperationalExpense.find()
      .populate("relatedTankId", "name") // Hiện tên bể nếu có
      .sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Cập nhật
exports.updateExpense = async (req, res) => {
  try {
    const expenseData = { ...req.body };
    if (expenseData.relatedTankId === "") expenseData.relatedTankId = null;

    const updatedExpense = await OperationalExpense.findByIdAndUpdate(
      req.params.id, 
      expenseData, 
      { new: true, runValidators: true }
    );
    if (!updatedExpense) return res.status(404).json({ message: "Không tìm thấy" });
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Xóa
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await OperationalExpense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Không tìm thấy" });
    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};