import { useEffect, useState, useCallback, useContext } from "react";
import axios from "axios";
import Layout from "../components/Layout";
export default function OperationalExpenseManager() {
  const API_EXPENSE = "http://localhost:5000/api/ChiPhiVanHanh";
  const API_TANK = "http://localhost:5000/api/tank";

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

  const [expenses, setExpenses] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  // const { searchTerm } = useContext(SearchContext); // Dùng dòng này khi chạy thật

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Danh mục chi phí
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
    type: "Khác",
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

  // --- 3. Logic lọc dữ liệu (Tìm kiếm đầy đủ thông tin) ---
  const filteredExpenses = expenses.filter((item) => {
    if (!searchTerm) return true;
    const lowerTerm = removeAccents(searchTerm);

    // Tìm trong: Tên chi phí, Loại, Người chi, Tên bể, Ghi chú, Số tiền
    return (
      removeAccents(item.name).includes(lowerTerm) ||
      removeAccents(item.type).includes(lowerTerm) ||
      removeAccents(item.payer || "").includes(lowerTerm) ||
      removeAccents(item.relatedTankId?.name || "chung").includes(lowerTerm) ||
      removeAccents(item.note || "").includes(lowerTerm) ||
      (item.amount && item.amount.toString().includes(lowerTerm))
    );
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === "" ? "" : Number(value)) : value
    }));
  };

  const fetchData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      // Fallback demo
      fetchData();
      closePopup();
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_EXPENSE}/${selectedRecord._id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert("Xóa thành công"); fetchData(); closePopup();
    } catch (err) {
      // Fallback demo
      const newExp = expenses.filter(e => e._id !== selectedRecord._id);
      setExpenses(newExp);
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
          <h1 className="text-3xl font-bold text-blue-600 shrink-0">Chi Phí Vận Hành</h1>

          <div className="flex w-full md:w-auto gap-3 items-center">
            {/* THANH TÌM KIẾM */}
            <div className="relative flex-1 md:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Tìm tên, loại, người chi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 outline-none"
              />
            </div>

            <button
              onClick={() => openPopup("create")}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shrink-0 shadow-md font-bold flex items-center"
            >
              <span className="mr-1 text-xl">+</span> Thêm Chi Phí
            </button>
          </div>
        </div>

        {/* 5. TABLE (Thêm table-fixed) */}
        {loading ? <p className="text-center text-gray-600">Đang tải...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[60px]">STT</th>
                  <th className="py-3 px-4 text-left w-[180px]">Khoản chi</th>
                  <th className="py-3 px-4 text-center w-[120px]">Loại</th>
                  <th className="py-3 px-4 text-right w-[120px]">Số tiền</th>
                  <th className="py-3 px-4 text-center w-[120px]">Ngày chi</th>
                  <th className="py-3 px-4 text-center w-[150px]">Gắn với Bể</th>
                  <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((item, index) => (
                  <tr key={item._id} className="border-b hover:bg-gray-100 h-[60px]">
                    <td className="py-3 px-4 text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 truncate" title={item.name}>{item.name}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      <span className={`px-2 py-1 rounded border font-bold text-xs ${item.type === 'Tiền điện' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                          item.type === 'Tiền nước' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                            'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-red-600 truncate">{formatCurrency(item.amount)}</td>
                    <td className="py-3 px-4 text-center text-sm text-slate-500">{formatDate(item.date)}</td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600 truncate" title={item.relatedTankId?.name}>{item.relatedTankId?.name || 'Chung'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-center">
                        {/* Thêm nút Xem */}
                        <button onClick={() => openPopup("view", item)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition shadow-sm" title="Xem">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => openPopup("edit", item)} className="p-1.5 bg-amber-100 text-amber-600 rounded-md hover:bg-amber-200 transition shadow-sm" title="Sửa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => openPopup("delete", item)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition shadow-sm" title="Xóa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr><td colSpan="7" className="text-center p-8 text-gray-500 italic">Không tìm thấy chi phí phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showPopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative max-h-[90vh] overflow-y-auto">

              {/* --- VIEW MODE --- */}
              {popupType === "view" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi Tiết Khoản Chi</h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Tên khoản chi:</strong> {selectedRecord.name}</p>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Loại:</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border text-sm">{selectedRecord.type}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Số tiền:</span>
                      <span className="text-red-600 font-bold text-lg">{formatCurrency(selectedRecord.amount)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Ngày chi:</span>
                      <span>{formatDate(selectedRecord.date)}</span>
                    </div>
                    <p><strong>Chi cho:</strong> {selectedRecord.relatedTankId?.name || "Chi phí chung (Toàn trại)"}</p>
                    <p><strong>Người chi:</strong> {selectedRecord.payer || "---"}</p>
                    <p><strong>Ghi chú:</strong> {selectedRecord.note || "---"}</p>
                  </div>
                  <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                </>
              )}

              {popupType === "delete" && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Khoản Chi?</h2>
                  <p className="mb-4 text-gray-700">Bạn có chắc muốn xóa khoản: <strong>{selectedRecord.name}</strong>?</p>
                  <div className="flex space-x-3">
                    <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xóa</button>
                    <button onClick={closePopup} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                  </div>
                </>
              )}

              {(popupType === "create" || popupType === "edit") && (
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
    </Layout>
  );
}