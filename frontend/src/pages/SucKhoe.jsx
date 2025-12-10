import { useEffect, useState } from "react";
import axios from "axios";
// ⚠️ KHI CHẠY DỰ ÁN THẬT: Bỏ chú thích dòng dưới đây
import Layout from "../components/Layout";

export default function HealthLogManager() {
  // --- API Configuration ---
  const API_HEALTH = "http://localhost:5000/api/suckhoe";
  const API_TANK = "http://localhost:5000/api/tank";
  const API_MEDICINE = "http://localhost:5000/api/Thuoc"; // API Kho thuốc

  // const token = localStorage.getItem("token");
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // --- State ---
  const [logs, setLogs] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [medicines, setMedicines] = useState([]); // State lưu danh sách thuốc
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // create | edit | view | delete
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    tankId: "",
    disease: "",
    medicine: "",      // ID thuốc
    medicineAmount: "", // Số lượng thuốc dùng
    survivalRate: "",
    notes: "",
    recordedAt: new Date().toISOString().split('T')[0],
  });

  // --- Helpers ---
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "---";
  const formatDateInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!token) {
        // Mock data cho preview
        setLogs([
            { _id: '1', tankId: { name: 'Bể số 1' }, disease: 'Nấm da', medicine: { name: 'Iodine', unit: 'lít' }, medicineAmount: 0.5, survivalRate: 98, notes: 'Đã xử lý xong', recordedAt: '2023-10-10' },
            { _id: '2', tankId: { name: 'Bể số 2' }, disease: 'Khỏe mạnh', medicine: null, medicineAmount: 0, survivalRate: 100, notes: 'Kiểm tra định kỳ', recordedAt: '2023-10-12' }
        ]);
        setTanks([{ _id: 't1', name: 'Bể số 1' }, { _id: 't2', name: 'Bể số 2' }]);
        setMedicines([{ _id: 'm1', name: 'Iodine', unit: 'lít', currentStock: 10 }, { _id: 'm2', name: 'Vitamin C', unit: 'kg', currentStock: 20 }]);
        return;
    }

    try {
      setLoading(true);
      const [resLogs, resTanks, resMeds] = await Promise.all([
        axios.get(API_HEALTH, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_MEDICINE, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setLogs(resLogs.data);
      setTanks(resTanks.data);
      setMedicines(resMeds.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      alert("Lỗi kết nối server");
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

    // Ép kiểu số cho các trường số liệu
    if (name === "survivalRate" || name === "medicineAmount") {
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
        tankId: record.tankId?._id || record.tankId || "",
        disease: record.disease || "",
        medicine: record.medicine?._id || record.medicine || "",
        medicineAmount: record.medicineAmount || "",
        survivalRate: record.survivalRate !== undefined ? record.survivalRate : "",
        notes: record.notes || "",
        recordedAt: formatDateInput(record.recordedAt),
      });
    } else {
      // Reset form
      setForm({
        tankId: "",
        disease: "",
        medicine: "",
        medicineAmount: "",
        survivalRate: "",
        notes: "",
        recordedAt: new Date().toISOString().split('T')[0],
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
    if (!form.tankId) { alert("Vui lòng chọn bể nuôi!"); return; }

    // Xử lý dữ liệu trước khi gửi
    const dataToSend = { ...form };
    if (!dataToSend.medicine) {
        dataToSend.medicine = null;
        dataToSend.medicineAmount = 0;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (popupType === "edit") {
        await axios.put(`${API_HEALTH}/${selectedRecord._id}`, dataToSend, config);
        alert("Cập nhật thành công");
      } else {
        await axios.post(API_HEALTH, dataToSend, config);
        alert("Ghi nhận sức khỏe thành công (Đã trừ kho thuốc nếu có)");
      }
      fetchData();
      closePopup();
    } catch (err) {
      console.error("Lỗi API:", err);
      // Hiển thị lỗi chi tiết từ backend (ví dụ: Hết thuốc)
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_HEALTH}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa bản ghi thành công");
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
          <h1 className="text-3xl font-bold text-blue-600">Quản Lý Sức Khỏe & Dịch Bệnh</h1>
          <button
            onClick={() => openPopup("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Thêm Nhật Ký
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
                  <th className="py-3 px-4 text-center w-[15%]">Bể Nuôi</th>
                  <th className="py-3 px-4 text-left w-[15%]">Vấn đề / Bệnh</th>
                  <th className="py-3 px-4 text-center w-[20%]">Thuốc & Liều lượng</th>
                  <th className="py-3 px-4 text-center w-[10%]">Tỉ lệ sống</th>
                  <th className="py-3 px-4 text-center w-[10%]">Ngày ghi</th>
                  <th className="py-3 px-4 text-left w-[15%]">Ghi chú</th>
                  <th className="py-3 px-4 text-center w-[10%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4 text-center font-medium">{log.tankId?.name || '---'}</td>
                    <td className="py-3 px-4 text-left text-red-600 font-medium">{log.disease || 'Bình thường'}</td>
                    
                    {/* Hiển thị thuốc + liều lượng */}
                    <td className="py-3 px-4 text-center">
                        {log.medicine ? (
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm border border-blue-200">
                                {log.medicine.name}: {log.medicineAmount} {log.medicine.unit}
                            </span>
                        ) : (
                            <span className="text-gray-400 text-sm">---</span>
                        )}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {log.survivalRate !== undefined ? `${log.survivalRate}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">{formatDate(log.recordedAt)}</td>
                    
                    {/* Cột Ghi chú đã được thêm */}
                    <td className="py-3 px-4 text-left text-sm text-gray-600 max-w-xs truncate" title={log.notes}>
                        {log.notes || ''}
                    </td>

                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button onClick={() => openPopup("view", log)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">Xem</button>
                      <button onClick={() => openPopup("edit", log)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm">Sửa</button>
                      <button onClick={() => openPopup("delete", log)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Xóa</button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-4 text-gray-500">Chưa có dữ liệu sức khỏe.</td></tr>
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
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi tiết Sức Khỏe</h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Bể nuôi:</strong> {selectedRecord.tankId?.name}</p>
                    <p><strong>Ngày ghi nhận:</strong> {formatDate(selectedRecord.recordedAt)}</p>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                        <p><strong>Tình trạng/Bệnh:</strong> <span className="text-red-600 font-bold">{selectedRecord.disease || "Bình thường"}</span></p>
                        <p className="mt-1"><strong>Thuốc sử dụng:</strong> {selectedRecord.medicine ? `${selectedRecord.medicine.name} - ${selectedRecord.medicineAmount} ${selectedRecord.medicine.unit}` : "Không dùng thuốc"}</p>
                    </div>
                    <p><strong>Tỉ lệ sống sót ước tính:</strong> {selectedRecord.survivalRate}%</p>
                    <p><strong>Ghi chú:</strong> {selectedRecord.notes || "Không có"}</p>
                  </div>
                  <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                </>
              )}

              {/* --- CREATE / EDIT --- */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">{popupType === "create" ? "Ghi Nhật Ký Mới" : "Cập Nhật Nhật Ký"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    
                    {/* Chọn Bể */}
                    <select name="tankId" value={form.tankId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                      <option value="">-- Chọn bể nuôi --</option>
                      {tanks.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
                    </select>

                    {/* Ngày ghi nhận */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500">Ngày ghi nhận</label>
                        <input type="date" name="recordedAt" value={form.recordedAt} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>

                    <input type="text" name="disease" placeholder="Tên bệnh / Vấn đề sức khỏe" value={form.disease} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />

                    {/* Chọn Thuốc và Liều lượng */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm font-bold text-blue-800 mb-2">Sử dụng Thuốc (Nếu có)</p>
                        <select name="medicine" value={form.medicine} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 bg-white">
                            <option value="">-- Không dùng thuốc --</option>
                            {medicines.map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.name} (Còn: {m.currentStock} {m.unit})
                                </option>
                            ))}
                        </select>
                        
                        {/* Chỉ hiện ô nhập liều lượng nếu đã chọn thuốc */}
                        {form.medicine && (
                            <div className="flex items-center gap-2">
                                <input type="number" name="medicineAmount" placeholder="Số lượng dùng" value={form.medicineAmount} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" min="0" step="0.1" required />
                                <span className="text-gray-600 text-sm font-bold">
                                    {medicines.find(m => m._id === form.medicine)?.unit || ''}
                                </span>
                            </div>
                        )}
                    </div>

                    <input type="number" name="survivalRate" placeholder="Tỉ lệ sống sót ước tính (%)" value={form.survivalRate} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" min="0" max="100" />

                    <textarea name="notes" placeholder="Ghi chú chi tiết..." rows="3" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />

                    {/* NÚT NGANG HÀNG */}
                    <div className="flex space-x-3 pt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">{popupType === "create" ? "Lưu lại" : "Cập nhật"}</button>
                      <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                    </div>
                  </form>
                </>
              )}

              {/* --- DELETE --- */}
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Nhật Ký?</h2>
                  <p className="mb-4 text-gray-700">Bạn có chắc chắn muốn xóa nhật ký ngày <strong>{formatDate(selectedRecord.recordedAt)}</strong> của <strong>{selectedRecord.tankId?.name}</strong>?</p>
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
