import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import Layout from "../components/Layout";

export default function FoodManager() {
  // --- API ---
  const API_URL = "http://localhost:5000/api/ThucAn"; 
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // --- State ---
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); 
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    type: "viên nổi", 
    protein: "",
    unit: "kg",
    quantityImport: "",
    pricePerUnit: "",
    totalCost: "",
    supplierName: "",
    supplierPhone: "",
    source: "",
    expiryDate: "",
    notes: ""
  });

  // --- Helpers ---
  const formatCurrency = (amount) => amount?.toLocaleString('vi-VN') + ' VND';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "---";
  const formatDateInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

  // --- Fetch Data ---
  const fetchFoods = useCallback(async () => {
    if (!token) {
        // Mock data preview
        setFoods([
            { _id: '1', name: 'Cám Cargill 40 đạm', type: 'viên nổi', protein: 40, unit: 'kg', currentStock: 50, quantityImport: 100, pricePerUnit: 35000, totalCost: 3500000, expiryDate: '2024-12-31' },
            { _id: '2', name: 'Trùn quế đông lạnh', type: 'tươi sống', protein: 60, unit: 'kg', currentStock: 10, quantityImport: 20, pricePerUnit: 120000, totalCost: 2400000, expiryDate: '2024-06-30' }
        ]);
        return;
    }

    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFoods(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách thức ăn:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // --- Handle Input & Auto Calculate ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (['quantityImport', 'pricePerUnit', 'totalCost', 'protein'].includes(name)) {
        processedValue = value === "" ? "" : Number(value);
    }

    setForm(prev => {
        const newForm = { ...prev, [name]: processedValue };
        
        // Tự động tính Tổng tiền
        if (name === 'quantityImport' || name === 'pricePerUnit') {
            const qty = name === 'quantityImport' ? processedValue : prev.quantityImport;
            const price = name === 'pricePerUnit' ? processedValue : prev.pricePerUnit;
            if (qty && price) {
                newForm.totalCost = qty * price;
            }
        }
        return newForm;
    });
  };

  // --- Popup Handlers ---
  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    if (record) {
      setForm({
        name: record.name,
        type: record.type || "viên nổi",
        protein: record.protein || "",
        unit: record.unit,
        quantityImport: record.quantityImport,
        pricePerUnit: record.pricePerUnit,
        totalCost: record.totalCost,
        supplierName: record.supplierName || "",
        supplierPhone: record.supplierPhone || "",
        source: record.source || "",
        expiryDate: formatDateInput(record.expiryDate),
        notes: record.notes || ""
      });
    } else {
      setForm({
        name: "", type: "viên nổi", protein: "", unit: "kg", quantityImport: "", pricePerUnit: "", 
        totalCost: "", supplierName: "", supplierPhone: "", source: "", expiryDate: "", notes: ""
      });
    }
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType("");
    setSelectedRecord(null);
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (popupType === "edit") {
        await axios.put(`${API_URL}/${selectedRecord._id}`, form, config);
        alert("Cập nhật thành công");
      } else {
        await axios.post(API_URL, form, config);
        alert("Nhập kho thành công");
      }
      fetchFoods();
      closePopup();
    } catch (err) {
      console.error("Lỗi API:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa thành công");
      fetchFoods();
      closePopup();
    } catch (err) {
      alert("Xóa thất bại");
    }
  };

  return (
    <Layout>
      <div className="p-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Quản Lý Kho Thức Ăn</h1>
          <button
            onClick={() => openPopup("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Nhập Thức Ăn
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[5%]">STT</th>
                  <th className="py-3 px-4 text-left w-[15%]">Tên thức ăn</th>
                  <th className="py-3 px-4 text-center w-[10%]">Loại</th>
                  <th className="py-3 px-4 text-center w-[5%]">Đạm</th>
                  <th className="py-3 px-4 text-center w-[10%]">Tồn kho</th>
                  <th className="py-3 px-4 text-right w-[10%]">Giá nhập</th>
                  <th className="py-3 px-4 text-right w-[15%]">Tổng tiền</th>
                  <th className="py-3 px-4 text-center w-[10%]">Hạn SD</th>
                  <th className="py-3 px-4 text-center w-[15%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((item, index) => (
                  <tr key={item._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">{item.type}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{item.protein ? item.protein + '%' : '-'}</td>
                    <td className={`py-3 px-4 text-center font-bold ${item.currentStock < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{formatCurrency(item.pricePerUnit)}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(item.totalCost)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatDate(item.expiryDate)}</td>
                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button onClick={() => openPopup("view", item)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">Xem</button>
                      <button onClick={() => openPopup("edit", item)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm">Sửa</button>
                      <button onClick={() => openPopup("delete", item)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Xóa</button>
                    </td>
                  </tr>
                ))}
                {foods.length === 0 && (
                  <tr><td colSpan="9" className="text-center p-4 text-gray-500">Kho thức ăn trống.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP */}
        {showPopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
            <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-xl relative max-h-[90vh] overflow-y-auto">
              
              {/* --- VIEW --- */}
              {popupType === "view" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi tiết Thức Ăn</h2>
                  <div className="grid grid-cols-2 gap-4 text-gray-700">
                    <div className="col-span-2 p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="font-semibold text-lg">{selectedRecord.name}</p>
                        <p className="text-sm text-gray-500">Loại: {selectedRecord.type} - Đạm: {selectedRecord.protein}%</p>
                    </div>
                    
                    <p><strong>Tồn kho:</strong> <span className="text-blue-600 font-bold">{selectedRecord.currentStock} {selectedRecord.unit}</span></p>
                    <p><strong>Hạn SD:</strong> {formatDate(selectedRecord.expiryDate)}</p>

                    <p><strong>Giá nhập:</strong> {formatCurrency(selectedRecord.pricePerUnit)}</p>
                    <p><strong>Tổng tiền lô:</strong> <span className="text-red-600 font-bold">{formatCurrency(selectedRecord.totalCost)}</span></p>

                    <div className="col-span-2 border-t pt-2 mt-2">
                        <p className="text-sm text-gray-500 font-bold">Thông tin nhà cung cấp:</p>
                        <p>Nơi bán: {selectedRecord.source || '---'}</p>
                        <p>Người liên hệ: {selectedRecord.supplierName || '---'} - {selectedRecord.supplierPhone}</p>
                    </div>
                    <div className="col-span-2"><p><strong>Ghi chú:</strong> {selectedRecord.notes || "Không có"}</p></div>
                  </div>
                  <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                </>
              )}

              {/* --- CREATE / EDIT --- */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">{popupType === "create" ? "Nhập Thức Ăn Mới" : "Cập Nhật Thông Tin"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Tên thức ăn */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Tên thức ăn <span className="text-red-500">*</span></label>
                        <input type="text" name="name" placeholder="VD: Cám 40 đạm..." value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                    
                    {/* Loại & Đạm */}
                    <div className="flex gap-4">
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-bold text-gray-700 mb-1">Loại thức ăn</label>
                            <select name="type" value={form.type} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="viên nổi">Viên nổi</option>
                                <option value="viên chìm">Viên chìm</option>
                                <option value="bột">Bột</option>
                                <option value="tươi sống">Tươi sống</option>
                                <option value="khác">Khác</option>
                            </select>
                        </div>
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-bold text-gray-700 mb-1">Độ đạm (%)</label>
                            <input type="number" name="protein" placeholder="VD: 40" value={form.protein} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                    </div>

                    {/* Số lượng & Đơn vị */}
                    <div className="flex gap-4">
                        <div className="flex flex-col w-1/3">
                            <label className="text-sm font-bold text-gray-700 mb-1">Đơn vị</label>
                            <select name="unit" value={form.unit} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="kg">Kg</option>
                                <option value="bao">Bao</option>
                                <option value="tấn">Tấn</option>
                                <option value="gói">Gói</option>
                            </select>
                        </div>
                        <div className="flex flex-col w-2/3">
                            <label className="text-sm font-bold text-gray-700 mb-1">Số lượng nhập <span className="text-red-500">*</span></label>
                            <input type="number" name="quantityImport" placeholder="0" value={form.quantityImport} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="0" />
                        </div>
                    </div>

                    {/* Giá & Tổng tiền */}
                    <div className="flex gap-4">
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-bold text-gray-700 mb-1">Đơn giá (VNĐ) <span className="text-red-500">*</span></label>
                            <input type="number" name="pricePerUnit" placeholder="0" value={form.pricePerUnit} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="0" />
                        </div>
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-bold text-gray-700 mb-1">Thành tiền (Tự tính)</label>
                            <input type="number" name="totalCost" placeholder="0" value={form.totalCost} onChange={handleChange} className="w-full border px-3 py-2 rounded bg-gray-100 font-bold text-green-700" readOnly />
                        </div>
                    </div>

                    {/* Hạn sử dụng */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Hạn sử dụng</label>
                        <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

                    <hr className="border-gray-200 my-2"/>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Thông tin nguồn gốc (Tùy chọn)</p>
                    
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Nguồn nhập / Cửa hàng</label>
                        <input type="text" name="source" placeholder="VD: Đại lý thức ăn A" value={form.source} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-bold text-gray-700 mb-1">Tên người bán</label>
                            <input type="text" name="supplierName" placeholder="Tên" value={form.supplierName} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                            <input type="text" name="supplierPhone" placeholder="SĐT" value={form.supplierPhone} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                        <textarea name="notes" placeholder="Ghi chú thêm..." rows="2" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

                    {/* Nút bấm ngang hàng */}
                    <div className="flex space-x-3 pt-4 border-t mt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">{popupType === "create" ? "Nhập kho" : "Cập nhật"}</button>
                      <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                    </div>
                  </form>
                </>
              )}

              {/* --- DELETE --- */}
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Thức Ăn?</h2>
                  <p className="mb-4 text-gray-700">Bạn có chắc chắn muốn xóa <strong>{selectedRecord.name}</strong> khỏi kho không?</p>
                  <div className="flex space-x-3">
                    <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xóa</button>
                    <button onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
