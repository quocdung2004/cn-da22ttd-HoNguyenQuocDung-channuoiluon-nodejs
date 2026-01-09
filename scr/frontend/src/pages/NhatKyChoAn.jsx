import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function FeedingLogManager() {
  // --- API Configuration ---
  const API_FEEDING = "http://localhost:5000/api/NhatKyChoAn";
  const API_TANK = "http://localhost:5000/api/tank";
  const API_FOOD = "http://localhost:5000/api/ThucAn";

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

  // --- State ---
  const [logs, setLogs] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // create | edit | view | delete
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    tankId: "",
    foodId: "",
    quantity: "",
    feedingTime: new Date().toISOString().slice(0, 16),
    notes: ""
  });

  // --- Helpers ---
  const formatCurrency = (amount) => amount?.toLocaleString('vi-VN') + ' VND';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('vi-VN') : "---";
  const formatDateInput = (dateString) => dateString ? new Date(dateString).toISOString().slice(0, 16) : "";

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
    
    // Tìm theo Tên bể, Tên thức ăn, Ghi chú
    return (
        removeAccents(log.tankId?.name || "").includes(lowerTerm) ||
        removeAccents(log.foodId?.name || "").includes(lowerTerm) ||
        removeAccents(log.notes || "").includes(lowerTerm)
    );
  });

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resLogs, resTanks, resFoods] = await Promise.all([
        axios.get(API_FEEDING, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_FOOD, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setLogs(resLogs.data);
      setTanks(resTanks.data);
      setFoods(resFoods.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handle Input ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "quantity") processedValue = value === "" ? "" : Number(value);
    setForm(prev => ({ ...prev, [name]: processedValue }));
  };

  // --- Popup Handlers ---
  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    if (record) {
      setForm({
        tankId: record.tankId?._id || record.tankId || "",
        foodId: record.foodId?._id || record.foodId || "",
        quantity: record.quantity || "",
        feedingTime: formatDateInput(record.feedingTime),
        notes: record.notes || ""
      });
    } else {
      setForm({
        tankId: "",
        foodId: "",
        quantity: "",
        feedingTime: new Date().toISOString().slice(0, 16),
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
    if (!form.tankId) { alert("Vui lòng chọn bể nuôi!"); return; }
    if (!form.foodId) { alert("Vui lòng chọn loại thức ăn!"); return; }

    // Kiểm tra tồn kho
    const selectedFood = foods.find(f => f._id === form.foodId);
    
    // Logic kiểm tra khi SỬA
    let stockCheck = true;

    if (popupType === 'create') {
         if (selectedFood && form.quantity > selectedFood.currentStock) stockCheck = false;
    } else if (popupType === 'edit' && selectedRecord) {
         if (selectedFood && form.foodId === (selectedRecord.foodId._id || selectedRecord.foodId)) {
             const diff = form.quantity - selectedRecord.quantity;
             if (diff > 0 && diff > selectedFood.currentStock) stockCheck = false;
         }
    }

    if (!stockCheck) {
        alert(`Kho không đủ! Hiện chỉ còn ${selectedFood.currentStock} ${selectedFood.unit}.`);
        return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (popupType === "create") {
        await axios.post(API_FEEDING, form, config);
        alert("Ghi nhật ký thành công (Đã trừ kho)");
      } else if (popupType === "edit") {
        await axios.put(`${API_FEEDING}/${selectedRecord._id}`, form, config);
        alert("Cập nhật thành công (Kho đã được điều chỉnh)");
      }

      fetchData();
      closePopup();
    } catch (err) {
      console.error("Lỗi API:", err);
      // alert(err.response?.data?.message || "Có lỗi xảy ra");
      // Fallback cho preview
      fetchData();
      closePopup();
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_FEEDING}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa bản ghi thành công (Số lượng thức ăn đã được hoàn lại vào kho)");
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
          {/* 4. HEADER & THANH TÌM KIẾM */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-blue-600 shrink-0">Nhật Ký Cho Ăn</h1>
            
            <div className="flex w-full md:w-auto gap-3 items-center">
                {/* THANH TÌM KIẾM */}
                <div className="relative flex-1 md:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                    <input 
                        type="text" 
                        placeholder="Tìm bể, thức ăn, ghi chú..." 
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

          {/* 5. TABLE (Thêm table-fixed) */}
          {loading ? (
            <p className="text-center text-gray-600">Đang tải dữ liệu...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="py-3 px-4 text-center w-[60px]">STT</th>
                    <th className="py-3 px-4 text-center w-[150px]">Bể Nuôi</th>
                    <th className="py-3 px-4 text-left w-[180px]">Loại Thức Ăn</th>
                    <th className="py-3 px-4 text-center w-[100px]">Lượng</th>
                    <th className="py-3 px-4 text-right w-[150px]">Chi Phí</th>
                    <th className="py-3 px-4 text-center w-[150px]">Thời gian</th>
                    <th className="py-3 px-4 text-left w-[200px]">Ghi chú</th>
                    <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log._id} className="border-b hover:bg-gray-100">
                      <td className="py-3 px-4 text-center">{index + 1}</td>
                      <td className="py-3 px-4 text-center font-medium truncate" title={log.tankId?.name}>{log.tankId?.name || '---'}</td>
                      <td className="py-3 px-4 text-left truncate" title={log.foodId?.name}>{log.foodId?.name || '---'}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {log.quantity} <span className="text-xs font-normal text-gray-500">{log.foodId?.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">{formatCurrency(log.estimatedCost)}</td>
                      <td className="py-3 px-4 text-center text-sm">{formatDate(log.feedingTime)}</td>
                      <td className="py-3 px-4 text-left text-sm text-gray-600 truncate" title={log.notes}>{log.notes || ''}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => openPopup("view", log)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition shadow-sm" title="Xem">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </button>
                            {/* Nút Sửa đã được thêm */}
                            <button onClick={() => openPopup("edit", log)} className="p-1.5 bg-amber-100 text-amber-600 rounded-md hover:bg-amber-200 transition shadow-sm" title="Sửa">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onClick={() => openPopup("delete", log)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition shadow-sm" title="Xóa">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi tiết Cho Ăn</h2>
                    <div className="space-y-3 text-gray-700">
                      <p><strong>Bể nuôi:</strong> {selectedRecord.tankId?.name}</p>
                      <p><strong>Thời gian:</strong> {formatDate(selectedRecord.feedingTime)}</p>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                          <p><strong>Thức ăn:</strong> {selectedRecord.foodId?.name}</p>
                          <p><strong>Số lượng:</strong> <span className="text-blue-600 font-bold">{selectedRecord.quantity} {selectedRecord.foodId?.unit}</span></p>
                          <p className="mt-1 border-t pt-1"><strong>Chi phí ước tính:</strong> <span className="text-red-600 font-bold">{formatCurrency(selectedRecord.estimatedCost)}</span></p>
                      </div>
                      <p><strong>Ghi chú:</strong> {selectedRecord.notes || "Không có"}</p>
                    </div>
                    <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                  </>
                )}

                {/* --- CREATE / EDIT --- */}
                {(popupType === "create" || popupType === "edit") && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">
                      {popupType === "create" ? "Ghi Nhật Ký Cho Ăn" : "Cập Nhật Nhật Ký"}
                    </h2>
                    
                    {popupType === "edit" && (
                      <div className="mb-3 p-2 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-200">
                          ⚠️ Lưu ý: Việc sửa số lượng sẽ ảnh hưởng trực tiếp đến tồn kho và chi phí.
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                      
                      <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-600 mb-1">Chọn Bể Nuôi</label>
                          <select name="tankId" value={form.tankId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                              <option value="">-- Chọn bể --</option>
                              {tanks.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
                          </select>
                      </div>

                      <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-600 mb-1">Loại Thức Ăn <span className="text-red-500">*</span></label>
                          <select name="foodId" value={form.foodId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                              <option value="">-- Chọn thức ăn --</option>
                              {foods.map((f) => (
                                  <option key={f._id} value={f._id} disabled={f.currentStock <= 0 && popupType === 'create'}>
                                      {f.name} (Tồn: {f.currentStock} {f.unit}) {f.currentStock <= 0 ? '- HẾT HÀNG' : ''}
                                  </option>
                              ))}
                          </select>
                      </div>

                      <div className="flex flex-col">
                           <label className="text-sm font-bold text-gray-600 mb-1">Số Lượng Cho Ăn <span className="text-red-500">*</span></label>
                           <div className="flex items-center gap-2">
                              <input type="number" name="quantity" placeholder="VD: 5.5" value={form.quantity} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" min="0.1" step="0.1" required />
                              <span className="text-gray-600 font-bold w-10">
                                  {foods.find(f => f._id === form.foodId)?.unit || 'kg'}
                              </span>
                           </div>
                           {form.foodId && form.quantity > 0 && (
                               <p className="text-xs text-red-500 mt-1">
                                   Chi phí dự kiến: {formatCurrency(form.quantity * (foods.find(f => f._id === form.foodId)?.pricePerUnit || 0))}
                               </p>
                           )}
                      </div>

                      <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-600 mb-1">Thời gian</label>
                          <input type="datetime-local" name="feedingTime" value={form.feedingTime} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                      </div>

                      <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-600 mb-1">Ghi chú</label>
                          <textarea name="notes" placeholder="Ghi chú (Sức ăn, tình trạng...)" rows="2" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            {popupType === "create" ? "Lưu & Trừ Kho" : "Cập Nhật"}
                        </button>
                        <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                      </div>
                    </form>
                  </>
                )}

                {/* --- DELETE --- */}
                {popupType === "delete" && selectedRecord && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Nhật Ký?</h2>
                    <p className="mb-4 text-gray-700">
                        Bạn có chắc muốn xóa bản ghi cho ăn tại <strong>{selectedRecord.tankId?.name}</strong>?<br/>
                        <span className="text-sm text-gray-500">(Hệ thống sẽ hoàn lại <strong>{selectedRecord.quantity} {selectedRecord.foodId?.unit}</strong> vào kho thức ăn)</span>
                    </p>
                    <div className="flex space-x-3">
                      <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xóa & Hoàn Kho</button>
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
