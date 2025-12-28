import { useEffect, useState } from "react";
import axios from "axios";
// ⚠️ KHI CHẠY DỰ ÁN THẬT: Bỏ chú thích dòng dưới đây
import Layout from "../components/Layout";

export default function FeedingLogManager() {
  // --- API Configuration ---
  const API_FEEDING = "http://localhost:5000/api/NhatKyChoAn";
  const API_TANK = "http://localhost:5000/api/tank";
  const API_FOOD = "http://localhost:5000/api/ThucAn";

  // const token = localStorage.getItem("token");
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // --- State ---
  const [logs, setLogs] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!token) {
        // Mock data...
        setLogs([{ _id: '1', tankId: { name: 'Bể số 1' }, foodId: { name: 'Cám viên', unit: 'kg' }, quantity: 2.5, estimatedCost: 87500, feedingTime: '2023-10-10T08:30:00', notes: 'Ăn mạnh' }]);
        setTanks([{ _id: 't1', name: 'Bể số 1' }]);
        setFoods([{ _id: 'f1', name: 'Cám viên', unit: 'kg', currentStock: 50, pricePerUnit: 35000 }]);
        return;
    }

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
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      alert(err.response?.data?.message || "Có lỗi xảy ra");
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
      alert("Xóa thất bại");
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Nhật Ký Cho Ăn</h1>
          <button onClick={() => openPopup("create")} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
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
                  <th className="py-3 px-4 text-left w-[20%]">Loại Thức Ăn</th>
                  <th className="py-3 px-4 text-center w-[10%]">Lượng</th>
                  <th className="py-3 px-4 text-right w-[15%]">Chi Phí</th>
                  <th className="py-3 px-4 text-center w-[15%]">Thời gian</th>
                  <th className="py-3 px-4 text-left w-[10%]">Ghi chú</th>
                  <th className="py-3 px-4 text-center w-[10%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4 text-center font-medium">{log.tankId?.name || '---'}</td>
                    <td className="py-3 px-4 text-left">{log.foodId?.name || '---'}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">{log.quantity} {log.foodId?.unit}</td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">{formatCurrency(log.estimatedCost)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatDate(log.feedingTime)}</td>
                    <td className="py-3 px-4 text-left text-sm text-gray-600 max-w-xs truncate" title={log.notes}>{log.notes || ''}</td>
                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button onClick={() => openPopup("view", log)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">Xem</button>
                      <button onClick={() => openPopup("edit", log)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm">Sửa</button>
                      <button onClick={() => openPopup("delete", log)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Xóa</button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-4 text-gray-500">Chưa có nhật ký cho ăn nào.</td></tr>
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
                        <label className="text-sm font-bold text-gray-600 mb-1">Loại Thức Ăn</label>
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
                         <label className="text-sm font-bold text-gray-600 mb-1">Số Lượng Cho Ăn</label>
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
                        <label className="text-sm text-gray-600 mb-1">Thời gian</label>
                        <input type="datetime-local" name="feedingTime" value={form.feedingTime} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>

                    <textarea name="notes" placeholder="Ghi chú (Sức ăn, tình trạng...)" rows="2" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />

                    <div className="flex space-x-3 pt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                          {popupType === "create" ? "Lưu & Trừ Kho" : "Cập Nhật"}
                      </button>
                      <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                    </div>
                  </form>
                </>
              )}

              {/* --- DELETE (ĐÃ CẬP NHẬT THÔNG BÁO RÕ RÀNG) --- */}
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Nhật Ký?</h2>
                  <div className="mb-6 bg-orange-50 p-4 rounded-lg border border-orange-200 text-sm text-gray-700">
                      <p className="mb-2 font-bold">Bạn đang thực hiện xóa bản ghi cho ăn tại {selectedRecord.tankId?.name}.</p>
                      <ul className="list-disc list-inside space-y-1">
                          <li>Hệ thống sẽ coi như việc cho ăn này <strong>chưa từng xảy ra</strong> (nhập sai).</li>
                          <li>Số lượng <strong>{selectedRecord.quantity} {selectedRecord.foodId?.unit}</strong> thức ăn sẽ được <strong>hoàn trả lại vào kho</strong>.</li>
                      </ul>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xác nhận Xóa & Hoàn Kho</button>
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