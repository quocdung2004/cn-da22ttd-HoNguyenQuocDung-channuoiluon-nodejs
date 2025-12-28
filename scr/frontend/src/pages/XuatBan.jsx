import { useEffect, useState } from "react";
import axios from "axios";

import Layout from "../components/Layout";

export default function HarvestManager() {
  // --- API ---
  const API_HARVEST = "http://localhost:5000/api/XuatBan";
  const API_TANK = "http://localhost:5000/api/tank";
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // --- State ---
  const [harvests, setHarvests] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // create | edit | view | delete
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    tankId: "",
    buyerName: "",
    buyerPhone: "",
    saleDate: new Date().toISOString().split('T')[0],
    
    totalWeight: "",    // Tổng số Kg
    pricePerKg: "",     // Giá 1 Kg
    totalRevenue: "",   // Thành tiền
    
    quantitySold: "",   // Số con
    isFinalHarvest: false,
    notes: ""
  });

  // --- Helpers ---
  const formatCurrency = (amount) => amount?.toLocaleString('vi-VN') + ' VND';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "---";
  const formatDateInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!token) {
        // Mock data preview
        setHarvests([
            { _id: '1', tankId: { name: 'Bể số 1' }, buyerName: 'Lái Tuấn', totalWeight: 50, totalRevenue: 5500000, quantitySold: 300, isFinalHarvest: false, saleDate: '2023-11-01' },
            { _id: '2', tankId: { name: 'Bể số 2' }, buyerName: 'Chị Lan', totalWeight: 120, totalRevenue: 13200000, quantitySold: 800, isFinalHarvest: true, saleDate: '2023-11-05' }
        ]);
        setTanks([{ _id: 't1', name: 'Bể số 1', status: 'raising', currentQuantity: 2000 }, { _id: 't2', name: 'Bể số 2', status: 'empty', currentQuantity: 0 }]);
        return;
    }

    try {
      setLoading(true);
      const [resHar, resTank] = await Promise.all([
        axios.get(API_HARVEST, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setHarvests(resHar.data);
      setTanks(resTank.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handle Input & Auto Calculate ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    if (['totalWeight', 'totalRevenue', 'quantitySold', 'pricePerKg'].includes(name)) {
        processedValue = value === "" ? "" : Number(value);
    }

    setForm(prev => {
        const newForm = { ...prev, [name]: processedValue };
        
        // Tự động tính Thành tiền = Số ký * Giá
        if (name === 'totalWeight' || name === 'pricePerKg') {
            const w = name === 'totalWeight' ? processedValue : prev.totalWeight;
            const p = name === 'pricePerKg' ? processedValue : prev.pricePerKg;
            if (w && p) {
                newForm.totalRevenue = w * p;
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
      const calculatedPrice = (record.totalRevenue && record.totalWeight) 
        ? Math.round(record.totalRevenue / record.totalWeight) 
        : "";

      setForm({
        tankId: record.tankId?._id || record.tankId || "",
        buyerName: record.buyerName,
        buyerPhone: record.buyerPhone,
        saleDate: formatDateInput(record.saleDate),
        totalWeight: record.totalWeight,
        pricePerKg: calculatedPrice, 
        totalRevenue: record.totalRevenue,
        quantitySold: record.quantitySold,
        isFinalHarvest: record.isFinalHarvest,
        notes: record.notes || ""
      });
    } else {
      setForm({
        tankId: "",
        buyerName: "", buyerPhone: "",
        saleDate: new Date().toISOString().split('T')[0],
        totalWeight: "", pricePerKg: "", totalRevenue: "",
        quantitySold: "",
        isFinalHarvest: false,
        notes: ""
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
    if (!form.tankId) { alert("Vui lòng chọn bể xuất bán!"); return; }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (popupType === "edit") {
        await axios.put(`${API_HARVEST}/${selectedRecord._id}`, form, config);
        alert("Cập nhật phiếu bán thành công!");
      } else {
        await axios.post(API_HARVEST, form, config);
        alert(form.isFinalHarvest ? "Đã xuất bán và chốt ao thành công!" : "Đã bán tỉa thành công!");
      }
      
      fetchData();
      closePopup();
    } catch (err) {
      console.error("Lỗi API:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_HARVEST}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa phiếu bán thành công (Đã hoàn lại số lượng vào bể nếu bể đang nuôi)");
      fetchData();
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
          <h1 className="text-3xl font-bold text-blue-600">Quản Lý Xuất Bán</h1>
          <button
            onClick={() => openPopup("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Xuất Bán Mới
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-600">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[5%]">STT</th>
                  <th className="py-3 px-4 text-left w-[15%]">Bể bán</th>
                  <th className="py-3 px-4 text-left w-[15%]">Người mua</th>
                  <th className="py-3 px-4 text-center w-[10%]">Trọng lượng</th>
                  <th className="py-3 px-4 text-center w-[10%]">Số con</th>
                  <th className="py-3 px-4 text-right w-[15%]">Doanh thu</th>
                  <th className="py-3 px-4 text-center w-[10%]">Loại</th>
                  <th className="py-3 px-4 text-center w-[10%]">Ngày bán</th>
                  <th className="py-3 px-4 text-center w-[10%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {harvests.map((item, index) => (
                  <tr key={item._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{item.tankId?.name}</td>
                    <td className="py-3 px-4">{item.buyerName}</td>
                    <td className="py-3 px-4 text-center font-bold">{item.totalWeight} kg</td>
                    <td className="py-3 px-4 text-center">{item.quantitySold}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(item.totalRevenue)}</td>
                    
                    <td className="py-3 px-4 text-center">
                        {item.isFinalHarvest ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Tát ao</span>
                        ) : (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Bán tỉa</span>
                        )}
                    </td>

                    <td className="py-3 px-4 text-center text-sm">{formatDate(item.saleDate)}</td>
                    
                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button onClick={() => openPopup("view", item)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">Xem</button>
                      <button onClick={() => openPopup("edit", item)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm">Sửa</button>
                      <button onClick={() => openPopup("delete", item)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Xóa</button>
                    </td>
                  </tr>
                ))}
                {harvests.length === 0 && (
                  <tr><td colSpan="9" className="text-center p-4 text-gray-500">Chưa có lịch sử xuất bán.</td></tr>
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
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi tiết Phiếu Bán</h2>
                  <div className="grid grid-cols-2 gap-4 text-gray-700">
                    <div className="col-span-2 p-3 bg-blue-50 rounded border border-blue-100">
                        <p><strong>Bể bán:</strong> {selectedRecord.tankId?.name}</p>
                        <p><strong>Hình thức:</strong> {selectedRecord.isFinalHarvest ? "Tát ao (Bán hết)" : "Bán tỉa (Bán bớt)"}</p>
                        <p><strong>Ngày bán:</strong> {formatDate(selectedRecord.saleDate)}</p>
                    </div>
                    
                    <p><strong>Tổng trọng lượng:</strong> {selectedRecord.totalWeight} kg</p>
                    <p><strong>Số lượng con:</strong> {selectedRecord.quantitySold} con</p>
                    
                    <div className="col-span-2 text-right border-t pt-2">
                        <p className="text-lg">Tổng doanh thu:</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedRecord.totalRevenue)}</p>
                    </div>

                    <div className="col-span-2 border-t pt-2">
                        <p className="text-sm font-bold text-gray-500">Thông tin người mua:</p>
                        <p>{selectedRecord.buyerName} - {selectedRecord.buyerPhone || "Không có SĐT"}</p>
                    </div>
                    <div className="col-span-2"><p><strong>Ghi chú:</strong> {selectedRecord.notes}</p></div>
                  </div>
                  <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                </>
              )}

              {/* --- CREATE / EDIT --- */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">
                      {popupType === "create" ? "Lập Phiếu Xuất Bán" : "Cập Nhật Phiếu Bán"}
                  </h2>

                  {popupType === "edit" && (
                      <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded text-sm">
                          ⚠️ <strong>Lưu ý:</strong> Việc sửa số lượng con hoặc thay đổi loại hình bán có thể làm sai lệch số lượng tồn kho trong bể.
                      </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Chọn Bể */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Chọn Bể Xuất Bán <span className="text-red-500">*</span></label>
                        <select name="tankId" value={form.tankId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                            <option value="">-- Chọn bể --</option>
                            {tanks.filter(t => t.status === 'raising' || t._id === form.tankId).map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.name} {t.status === 'raising' ? `(Đang có: ${t.currentQuantity} con)` : '(Đã trống)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Thông tin bán hàng */}
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-sm font-bold text-blue-800 mb-2 border-b pb-1">Chi tiết bán hàng</p>
                        
                        <div className="flex gap-4 mb-3">
                            <div className="w-1/2">
                                <label className="text-xs font-bold text-gray-600">Tổng số ký (Kg) <span className="text-red-500">*</span></label>
                                <input type="number" name="totalWeight" placeholder="0" value={form.totalWeight} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="0" step="0.1"/>
                            </div>
                            <div className="w-1/2">
                                <label className="text-xs font-bold text-gray-600">Giá bán (VNĐ/kg) <span className="text-red-500">*</span></label>
                                <input type="number" name="pricePerKg" placeholder="0" value={form.pricePerKg} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="0" />
                            </div>
                        </div>
                        
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-600">Thành tiền (Tự tính)</label>
                            <input type="number" name="totalRevenue" placeholder="0" value={form.totalRevenue} onChange={handleChange} className="w-full border px-3 py-2 rounded bg-green-50 font-bold text-green-700 text-lg" required readOnly />
                        </div>
                    </div>

                    {/* Số lượng con để trừ kho */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-red-600 mb-1">Số con ước tính (Để trừ tồn kho bể) <span className="text-red-500">*</span></label>
                        <input type="number" name="quantitySold" placeholder="VD: 200 con" value={form.quantitySold} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="1" />
                    </div>

                    {/* Checkbox Tát ao */}
                    <div className="flex items-center gap-2 p-3 border rounded hover:bg-red-50 cursor-pointer transition bg-gray-50" onClick={() => setForm({...form, isFinalHarvest: !form.isFinalHarvest})}>
                        <input type="checkbox" name="isFinalHarvest" checked={form.isFinalHarvest} onChange={handleChange} className="w-5 h-5 text-blue-600 cursor-pointer" />
                        <div>
                            <span className="font-bold text-gray-800">Đây là đợt Tát Ao (Bán hết)?</span>
                            {form.isFinalHarvest && <p className="text-xs text-red-600 font-bold mt-1">⚠️ Cảnh báo: Bể sẽ được chuyển về trạng thái TRỐNG sau khi lưu!</p>}
                        </div>
                    </div>

                    <hr className="my-2 border-gray-200"/>

                    <div className="flex gap-4">
                        <div className="w-2/3">
                            <label className="text-xs font-bold text-gray-600">Tên người mua</label>
                            <input type="text" name="buyerName" placeholder="Tên" value={form.buyerName} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-gray-600">SĐT</label>
                            <input type="text" name="buyerPhone" placeholder="SĐT" value={form.buyerPhone} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-600">Ngày bán <span className="text-red-500">*</span></label>
                        <input type="date" name="saleDate" value={form.saleDate} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-600">Ghi chú</label>
                        <textarea name="notes" placeholder="Ghi chú thêm..." rows="2" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

                    <div className="flex space-x-3 pt-4 border-t mt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                          {popupType === "create" ? "Xác nhận Bán" : "Cập nhật"}
                      </button>
                      <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                    </div>
                  </form>
                </>
              )}

              {/* --- DELETE --- */}
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Hủy Phiếu Bán?</h2>
                  <p className="mb-4 text-gray-700">Bạn có chắc chắn muốn xóa phiếu bán ngày <strong>{formatDate(selectedRecord.saleDate)}</strong>?</p>
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