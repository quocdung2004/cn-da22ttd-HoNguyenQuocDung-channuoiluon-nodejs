import { useEffect, useState } from "react";
import axios from "axios";
// ⚠️ KHI CHẠY DỰ ÁN THẬT: Bỏ chú thích dòng dưới đây
import Layout from "../components/Layout";

export default function OperationalExpenseManager() {
  const API_EXPENSE = "http://localhost:5000/api/ChiPhiVanHanh"; 
  const API_TANK = "http://localhost:5000/api/tank";
  // const token = localStorage.getItem("token");
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  const [expenses, setExpenses] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); 
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Danh mục chi phí (Giờ dùng mảng tiếng Việt trực tiếp)
  const categories = [
    'Tiền điện', 
    'Tiền nước', 
    'Vận chuyển', 
    'Nhân công', 
    'Bảo trì', 
    'Khác'
  ];

  const [form, setForm] = useState({
    name: "",
    type: "Khác", // Mặc định tiếng Việt
    amount: "",
    date: new Date().toISOString().split('T')[0],
    payer: "",
    relatedTankId: "",
    note: ""
  });

  // --- Helpers ---
  const formatCurrency = (amount) => amount?.toLocaleString('vi-VN') + ' VND';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "---";
  const formatDateInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
        ...prev,
        [name]: name === 'amount' ? (value === "" ? "" : Number(value)) : value
    }));
  };

  const fetchData = async () => {
    if (!token) {
        // Mock data preview
        setExpenses([
            { _id: '1', name: 'Tiền điện T5', type: 'Tiền điện', amount: 500000, date: '2023-05-05', relatedTankId: null },
            { _id: '2', name: 'Sửa ống nước', type: 'Bảo trì', amount: 200000, date: '2023-05-06', relatedTankId: { name: 'Bể 1' } }
        ]);
        setTanks([{ _id: 't1', name: 'Bể 1' }]);
        return;
    }
    try {
      setLoading(true);
      const [resExp, resTank] = await Promise.all([
        axios.get(API_EXPENSE, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setExpenses(resExp.data);
      setTanks(resTank.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);
    if (record) {
      setForm({
        name: record.name,
        type: record.type,
        amount: record.amount,
        date: formatDateInput(record.date),
        payer: record.payer || "",
        relatedTankId: record.relatedTankId?._id || record.relatedTankId || "",
        note: record.note || ""
      });
    } else {
      setForm({ name: "", type: "Khác", amount: "", date: new Date().toISOString().split('T')[0], payer: "", relatedTankId: "", note: "" });
    }
    setShowPopup(true);
  };

  const closePopup = () => { setShowPopup(false); setSelectedRecord(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = { ...form, amount: Number(form.amount) };
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (popupType === "edit") await axios.put(`${API_EXPENSE}/${selectedRecord._id}`, dataToSend, config);
      else await axios.post(API_EXPENSE, dataToSend, config);
      
      alert(popupType === "create" ? "Thêm thành công" : "Cập nhật thành công");
      fetchData(); closePopup();
    } catch (err) { 
        console.error(err);
        alert(err.response?.data?.message || "Có lỗi xảy ra"); 
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_EXPENSE}/${selectedRecord._id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert("Xóa thành công"); fetchData(); closePopup();
    } catch (err) { alert("Xóa thất bại"); }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="w-full bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600">Chi Phí Vận Hành</h1>
            <button onClick={() => openPopup("create")} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                + Thêm Chi Phí
            </button>
            </div>

            {loading ? <p className="text-center text-gray-600">Đang tải...</p> : (
            <div className="overflow-x-auto">
                <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
                <thead className="bg-blue-500 text-white">
                    <tr>
                    <th className="py-3 px-4 text-center w-[5%]">STT</th>
                    <th className="py-3 px-4 text-left w-[20%]">Khoản chi</th>
                    <th className="py-3 px-4 text-center w-[15%]">Loại</th>
                    <th className="py-3 px-4 text-right w-[15%]">Số tiền</th>
                    <th className="py-3 px-4 text-center w-[15%]">Ngày chi</th>
                    <th className="py-3 px-4 text-center w-[15%]">Gắn với Bể</th>
                    <th className="py-3 px-4 text-center w-[15%]">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map((item, index) => (
                    <tr key={item._id} className="border-b hover:bg-gray-100">
                        <td className="py-3 px-4 text-center">{index + 1}</td>
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-center text-sm">
                            <span className={`px-2 py-1 rounded border ${
                                item.type === 'Tiền điện' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                item.type === 'Tiền nước' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                                {item.type}
                            </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-red-600">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-4 text-center">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 text-center text-sm">{item.relatedTankId?.name || 'Chung'}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                        <button onClick={() => openPopup("edit", item)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm">Sửa</button>
                        <button onClick={() => openPopup("delete", item)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Xóa</button>
                        </td>
                    </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan="7" className="text-center p-4 text-gray-500">Chưa có chi phí vận hành nào.</td></tr>}
                </tbody>
                </table>
            </div>
            )}

            {showPopup && (
            <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
                <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">
                {popupType === "delete" ? (
                    <>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Khoản Chi?</h2>
                    <p className="mb-4 text-gray-700">Bạn có chắc muốn xóa khoản: <strong>{selectedRecord.name}</strong>?</p>
                    <div className="flex space-x-3">
                        <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xóa</button>
                        <button onClick={closePopup} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                    </div>
                    </>
                ) : (
                    <>
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">{popupType === "create" ? "Thêm Mới" : "Cập Nhật"}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Tên khoản chi */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 mb-1">Tên khoản chi <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="VD: Tiền điện T5, Sửa máy bơm..." 
                                value={form.name} 
                                onChange={handleChange} 
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                required 
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            {/* Loại chi phí */}
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm font-bold text-gray-700 mb-1">Loại chi phí</label>
                                <select 
                                    name="type" 
                                    value={form.type} 
                                    onChange={handleChange} 
                                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    {categories.map((cat, index) => (
                                        <option key={index} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Số tiền */}
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm font-bold text-gray-700 mb-1">Số tiền (VNĐ) <span className="text-red-500">*</span></label>
                                <input 
                                    type="number" 
                                    name="amount" 
                                    placeholder="0" 
                                    value={form.amount} 
                                    onChange={handleChange} 
                                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                    required 
                                    min="0" 
                                />
                            </div>
                        </div>

                        {/* Chọn Bể */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 mb-1">Chi cho (Bể nào?)</label>
                            <select 
                                name="relatedTankId" 
                                value={form.relatedTankId} 
                                onChange={handleChange} 
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">-- Chi phí chung (Toàn trại) --</option>
                                {tanks.map(t => <option key={t._id} value={t._id}>Chi riêng cho: {t.name}</option>)}
                            </select>
                        </div>

                        {/* Người chi */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 mb-1">Người chi tiền</label>
                            <input 
                                type="text" 
                                name="payer" 
                                placeholder="Tên nhân viên..." 
                                value={form.payer} 
                                onChange={handleChange} 
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                            />
                        </div>
                        
                        {/* Ngày chi */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 mb-1">Ngày chi</label>
                            <input 
                                type="date" 
                                name="date" 
                                value={form.date} 
                                onChange={handleChange} 
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                required 
                            />
                        </div>
                        
                        {/* Ghi chú */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                            <textarea 
                                name="note" 
                                placeholder="Chi tiết thêm..." 
                                rows="2" 
                                value={form.note} 
                                onChange={handleChange} 
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                            />
                        </div>

                        {/* Nút bấm */}
                        <div className="flex space-x-3 pt-4 border-t mt-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            {popupType === "create" ? "Lưu lại" : "Cập nhật"}
                        </button>
                        <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy bỏ</button>
                        </div>
                    </form>
                    </>
                )}
                </div>
            </div>
            )}
        </div>
      </div>
    </Layout>
  );
}

