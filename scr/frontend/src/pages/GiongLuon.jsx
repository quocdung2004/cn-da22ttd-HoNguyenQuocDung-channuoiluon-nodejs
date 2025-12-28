import { useEffect, useState } from "react";
import axios from "axios";

import Layout from "../components/Layout";

export default function SeedBatchManager() {
  // --- API Configuration ---
  const API_SEED = "http://localhost:5000/api/GiongLuon";
  const API_TANK = "http://localhost:5000/api/tank";
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // --- State ---
  const [batches, setBatches] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // create | edit | view | delete
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    unit: "con", // Mặc định là con
    quantity: "",
    source: "",
    totalCost: "",
    tankId: "",
    importDate: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // --- Helpers ---
  const formatCurrency = (amount) => amount?.toLocaleString('vi-VN') + ' VND';
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');
  const formatDateForInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

  // --- Fetch Data ---
  const fetchData = async () => {
    // Dữ liệu giả lập cho Preview
    if (!token) {
        setBatches([
            { _id: '1', name: 'Lươn Nhật F1', unit: 'con', quantity: 2000, source: 'Trại giống A', totalCost: 6000000, tankId: { name: 'Bể số 1' }, importDate: '2023-10-01', notes: 'Giống khỏe' },
            { _id: '2', name: 'Lươn Đồng Thu Gom', unit: 'kg', quantity: 15, source: 'Thương lái B', totalCost: 3000000, tankId: { name: 'Bể số 2' }, importDate: '2023-10-05', notes: 'Hao hụt nhẹ' }
        ]);
        setTanks([
            { _id: 't1', name: 'Bể số 1', location: 'Khu A', size: 500 },
            { _id: 't2', name: 'Bể số 2', location: 'Khu B', size: 300 },
            { _id: 't3', name: 'Bể số 3', location: 'Khu A', size: 1000 }
        ]);
        return;
    }

    try {
      setLoading(true);
      const [resSeed, resTank] = await Promise.all([
        axios.get(API_SEED, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBatches(resSeed.data);
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

  // --- Handle Input ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "quantity" || name === "totalCost") {
        processedValue = value === "" ? "" : Number(value);
    }

    setForm(prev => ({ ...prev, [name]: processedValue }));
  };

  // --- Popup Handlers ---
  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    if (record) {
      setForm({
        name: record.name,
        unit: record.unit || "con",
        quantity: record.quantity,
        source: record.source || "",
        totalCost: record.totalCost,
        tankId: record.tankId?._id || record.tankId || "",
        importDate: formatDateForInput(record.importDate),
        notes: record.notes || ""
      });
    } else {
      setForm({
        name: "",
        unit: "con",
        quantity: "",
        source: "",
        totalCost: "",
        tankId: "",
        importDate: new Date().toISOString().split('T')[0],
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
    if (!form.tankId) { alert("Vui lòng chọn bể nuôi để thả giống!"); return; }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (popupType === "edit") {
        await axios.put(`${API_SEED}/${selectedRecord._id}`, form, config);
        alert("Cập nhật thành công");
      } else {
        await axios.post(API_SEED, form, config);
        alert("Nhập giống thành công!");
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
      await axios.delete(`${API_SEED}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa lô giống thành công");
      fetchData();
      closePopup();
    } catch (err) {
      console.error("Lỗi xóa:", err);
      alert("Xóa thất bại");
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Quản Lý Giống Nuôi</h1>
          <button
            onClick={() => openPopup("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Nhập Giống Mới
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[5%]">STT</th>
                  <th className="py-3 px-4 text-left w-[15%]">Tên Giống</th>
                  <th className="py-3 px-4 text-center w-[10%]">SL Nhập</th>
                  <th className="py-3 px-4 text-center w-[10%]">Đơn vị</th>
                  <th className="py-3 px-4 text-right w-[15%]">Chi Phí</th>
                  <th className="py-3 px-4 text-center w-[15%]">Bể Nuôi</th>
                  <th className="py-3 px-4 text-center w-[15%]">Ngày Nhập</th>
                  <th className="py-3 px-4 text-center w-[15%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((item, index) => {
                  const unitDisplay = (item.unit || 'con').toUpperCase();
                  return (
                    <tr key={item._id} className="border-b hover:bg-gray-100">
                      <td className="py-3 px-4 text-center">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${unitDisplay === 'CON' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {unitDisplay}
                          </span>
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.totalCost)}</td>
                      <td className="py-3 px-4 text-center">{item.tankId?.name || '---'}</td>
                      <td className="py-3 px-4 text-center">{formatDate(item.importDate)}</td>
                      <td className="py-3 px-4 flex justify-center gap-2">
                        <button onClick={() => openPopup("view", item)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">Xem</button>
                        <button onClick={() => openPopup("edit", item)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500">Sửa</button>
                        <button onClick={() => openPopup("delete", item)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
                      </td>
                    </tr>
                  );
                })}
                {batches.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-4 text-gray-500">Chưa có lô giống nào được nhập.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP */}
        {showPopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative max-h-[90vh] overflow-y-auto">
              
              {/* --- VIEW MODE --- */}
              {popupType === "view" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi Tiết Lô Giống</h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Tên giống:</strong> {selectedRecord.name}</p>
                    <p><strong>Nguồn nhập:</strong> {selectedRecord.source || "Không rõ"}</p>
                    <p><strong>Số lượng:</strong> <span className="text-blue-600 font-bold">{selectedRecord.quantity} {selectedRecord.unit || 'con'}</span></p>
                    <p><strong>Tổng chi phí:</strong> <span className="text-red-600 font-bold">{formatCurrency(selectedRecord.totalCost)}</span></p>
                    <p><strong>Nuôi tại:</strong> {selectedRecord.tankId?.name}</p>
                    <p><strong>Ngày nhập:</strong> {formatDate(selectedRecord.importDate)}</p>
                    <p><strong>Ghi chú:</strong> {selectedRecord.notes || "Không có"}</p>
                  </div>
                  <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                </>
              )}

              {/* --- CREATE / EDIT MODE --- */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">{popupType === "create" ? "Nhập Giống Mới" : "Cập Nhật Lô Giống"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Tên giống lươn <span className="text-red-500">*</span></label>
                        <input type="text" name="name" placeholder="VD: Lươn Nhật F1" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex flex-col w-2/3">
                             <label className="text-sm font-bold text-gray-700 mb-1">Số lượng <span className="text-red-500">*</span></label>
                             <input type="number" name="quantity" placeholder="0" value={form.quantity} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="1" />
                        </div>
                        <div className="flex flex-col w-1/3">
                             <label className="text-sm font-bold text-gray-700 mb-1">Đơn vị</label>
                             <select name="unit" value={form.unit} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="con">Con</option>
                                <option value="kg">Kg</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Tổng chi phí nhập (VNĐ) <span className="text-red-500">*</span></label>
                        <input type="number" name="totalCost" placeholder="0" value={form.totalCost} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="0" />
                    </div>
                    
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Nguồn nhập (Trại/Thương lái)</label>
                        <input type="text" name="source" placeholder="VD: Trại giống A" value={form.source} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Chọn bể thả nuôi <span className="text-red-500">*</span></label>
                        <select name="tankId" value={form.tankId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                            <option value="">-- Chọn bể --</option>
                            {tanks.map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.name} ({t.status === 'empty' ? 'Trống' : 'Đang nuôi'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Ngày nhập giống</label>
                        <input type="date" name="importDate" value={form.importDate} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-1">Ghi chú thêm</label>
                        <textarea name="notes" placeholder="VD: Giống khỏe, hao hụt ít..." rows="2" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

                    {/* NÚT NGANG HÀNG */}
                    <div className="flex space-x-3 pt-4 border-t mt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">{popupType === "create" ? "Lưu Lại" : "Cập Nhật"}</button>
                      <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                    </div>
                  </form>
                </>
              )}

              {/* --- DELETE MODE --- */}
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Lô Giống?</h2>
                  <p className="mb-4 text-gray-700">Bạn có chắc chắn muốn xóa lô <strong>{selectedRecord.name}</strong>?<br/><br/>⚠️ <strong>Lưu ý quan trọng:</strong> Hành động này sẽ <strong>Reset bể nuôi {selectedRecord.tankId?.name}</strong> về trạng thái TRỐNG!</p>
                  <div className="flex space-x-3">
                    <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xóa & Reset Bể</button>
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

