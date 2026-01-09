import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function HealthLogManager() {
  // --- CẤU HÌNH API ---
  const API_HEALTH = "http://localhost:5000/api/suckhoe";
  const API_TANK = "http://localhost:5000/api/tank";
  const API_MEDICINE = "http://localhost:5000/api/Thuoc";

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

  // --- STATE ---
  const [logs, setLogs] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Thêm State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    tankId: "",
    disease: "",
    medicine: "",
    medicineAmount: "",
    survivalRate: "",
    notes: "",
    recordedAt: new Date().toISOString().split('T')[0],
  });

  // --- HELPERS ---
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "---";
  const formatDateInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

  // --- 2. Hàm hỗ trợ tìm kiếm không dấu ---
  const removeAccents = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // --- 3. Logic lọc dữ liệu ---
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const lowerTerm = removeAccents(searchTerm);

    // Tìm theo Tên bể, Tên bệnh, Tên thuốc, Ghi chú
    return (
      removeAccents(log.tankId?.name || "").includes(lowerTerm) ||
      removeAccents(log.disease || "").includes(lowerTerm) ||
      removeAccents(log.medicine?.name || "").includes(lowerTerm) ||
      removeAccents(log.notes || "").includes(lowerTerm)
    );
  });

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLE INPUT ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "survivalRate" || name === "medicineAmount") {
      processedValue = value === "" ? "" : Number(value);
    }

    setForm(prev => ({ ...prev, [name]: processedValue }));
  };

  // --- POPUP HANDLERS ---
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

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tankId) { alert("Vui lòng chọn bể nuôi!"); return; }

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
      // Demo fallback
      fetchData();
      closePopup();
    }
  };

  // --- DELETE ---
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
      // Demo fallback
      const newLogs = logs.filter(l => l._id !== selectedRecord._id);
      setLogs(newLogs);
      closePopup();
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="text-center py-10 text-red-600 text-xl font-bold">
          Bạn chưa đăng nhập!
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* HEADER & THANH TÌM KIẾM */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-600 shrink-0">Quản Lý Sức Khỏe</h1>

          <div className="flex w-full md:w-auto gap-3 items-center">
            {/* THANH TÌM KIẾM */}
            <div className="relative flex-1 md:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Tìm bể, bệnh, thuốc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 outline-none"
              />
            </div>

            <button
              onClick={() => openPopup("create")}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shrink-0 shadow-md font-bold flex items-center"
            >
              <span className="mr-1 text-xl">+</span> Thêm Nhật Ký
            </button>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-600">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Thêm table-fixed */}
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[60px]">STT</th>
                  <th className="py-3 px-4 text-center w-[150px]">Bể Nuôi</th>
                  <th className="py-3 px-4 text-left w-[180px]">Vấn đề / Bệnh</th>
                  <th className="py-3 px-4 text-center w-[200px]">Thuốc & Liều lượng</th>
                  <th className="py-3 px-4 text-center w-[100px]">Tỉ lệ sống</th>
                  <th className="py-3 px-4 text-center w-[120px]">Ngày ghi</th>
                  <th className="py-3 px-4 text-left w-[200px]">Ghi chú</th>
                  <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={log._id} className="border-b hover:bg-gray-100 h-[60px]">
                    <td className="py-3 px-4 text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="py-3 px-4 text-center font-medium truncate" title={log.tankId?.name}>{log.tankId?.name || '---'}</td>
                    <td className="py-3 px-4 text-left text-red-600 font-medium truncate" title={log.disease}>{log.disease || 'Bình thường'}</td>

                    <td className="py-3 px-4 text-center truncate">
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
                    <td className="py-3 px-4 text-left text-sm text-gray-600 truncate" title={log.notes}>
                      {log.notes || ''}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openPopup("view", log)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition shadow-sm" title="Xem">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => openPopup("edit", log)} className="p-1.5 bg-amber-100 text-amber-600 rounded-md hover:bg-amber-200 transition shadow-sm" title="Sửa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => openPopup("delete", log)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition shadow-sm" title="Xóa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-8 text-gray-500 italic">Không tìm thấy nhật ký phù hợp.</td></tr>
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
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Bể nuôi:</span>
                      <span>{selectedRecord.tankId?.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Ngày ghi nhận:</span>
                      <span>{formatDate(selectedRecord.recordedAt)}</span>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p><strong>Tình trạng/Bệnh:</strong> <span className="text-red-600 font-bold">{selectedRecord.disease || "Bình thường"}</span></p>
                      <p className="mt-1"><strong>Thuốc sử dụng:</strong> {selectedRecord.medicine ? `${selectedRecord.medicine.name} - ${selectedRecord.medicineAmount} ${selectedRecord.medicine.unit}` : "Không dùng thuốc"}</p>
                    </div>
                    <div className="flex justify-between border-b pb-2 mt-2">
                      <span className="font-semibold">Tỉ lệ sống sót ước tính:</span>
                      <span className="font-bold">{selectedRecord.survivalRate}%</span>
                    </div>
                    <p className="mt-2"><strong>Ghi chú:</strong> {selectedRecord.notes || "Không có"}</p>
                  </div>
                  <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                </>
              )}

              {/* --- CREATE / EDIT --- */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">{popupType === "create" ? "Ghi Nhật Ký Mới" : "Cập Nhật Nhật Ký"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Chọn Bể */}
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Chọn Bể Nuôi <span className="text-red-500">*</span></label>
                      <select name="tankId" value={form.tankId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                        <option value="">-- Chọn bể nuôi --</option>
                        {tanks.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
                      </select>
                    </div>

                    {/* Ngày ghi nhận */}
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Ngày ghi nhận <span className="text-red-500">*</span></label>
                      <input type="date" name="recordedAt" value={form.recordedAt} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>

                    {/* Tên bệnh */}
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Tên bệnh / Vấn đề sức khỏe</label>
                      <input type="text" name="disease" placeholder="VD: Nấm da, bỏ ăn..." value={form.disease} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

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
                        <div className="flex flex-col mt-2">
                          <label className="text-xs font-bold text-gray-600 mb-1">Liều lượng:</label>
                          <div className="flex items-center gap-2">
                            <input type="number" name="medicineAmount" placeholder="Số lượng dùng" value={form.medicineAmount} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" min="0" step="0.1" required />
                            <span className="text-gray-600 text-sm font-bold w-12">
                              {medicines.find(m => m._id === form.medicine)?.unit || ''}
                            </span>
                          </div>
                          <p className="text-xs text-blue-500 mt-1 italic">
                            Kho còn: {medicines.find(m => m._id === form.medicine)?.currentStock || 0} {medicines.find(m => m._id === form.medicine)?.unit || ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tỉ lệ sống */}
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Tỉ lệ sống sót ước tính (%)</label>
                      <input type="number" name="survivalRate" placeholder="VD: 95" value={form.survivalRate} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" min="0" max="100" />
                    </div>

                    {/* Ghi chú */}
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                      <textarea name="notes" placeholder="Ghi chú chi tiết..." rows="2" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>

                    {/* NÚT NGANG HÀNG */}
                    <div className="flex space-x-3 pt-4 border-t mt-2">
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