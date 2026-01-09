import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function SeedBatchManager() {
  // --- API Configuration ---
  const API_SEED = "http://localhost:5000/api/GiongLuon";
  const API_TANK = "http://localhost:5000/api/tank";

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

  // --- State ---
  const [batches, setBatches] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    unit: "con",
    quantity: "",
    sizeGrade: "",
    pricePerUnit: "",
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

  // --- Hàm hỗ trợ tìm kiếm không dấu ---
  const removeAccents = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // --- Logic lọc dữ liệu ---
  const filteredBatches = batches.filter((batch) => {
    if (!searchTerm) return true;
    const lowerTerm = removeAccents(searchTerm);

    return (
      removeAccents(batch.name || "").includes(lowerTerm) ||
      removeAccents(batch.source || "").includes(lowerTerm) ||
      removeAccents(batch.tankId?.name || "").includes(lowerTerm)
    );
  });

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {

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
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handle Input & Tự động tính tiền ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (['quantity', 'sizeGrade', 'pricePerUnit', 'totalCost'].includes(name)) {
      processedValue = value === "" ? "" : Number(value);
    }

    setForm(prev => {
      const newForm = { ...prev, [name]: processedValue };

      if (name === 'quantity' || name === 'pricePerUnit') {
        const q = name === 'quantity' ? processedValue : prev.quantity;
        const p = name === 'pricePerUnit' ? processedValue : prev.pricePerUnit;
        if (q && p) {
          newForm.totalCost = q * p;
        }
      }
      return newForm;
    });
  };

  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    if (record) {
      setForm({
        name: record.name,
        unit: record.unit || "con",
        quantity: record.quantity,
        sizeGrade: record.sizeGrade || "",
        pricePerUnit: record.pricePerUnit || "",
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
        sizeGrade: "",
        pricePerUnit: "",
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
      const msg = err.response?.data?.message || err.response?.data?.error || "Có lỗi xảy ra";
      alert(`Lỗi: ${msg}`);
    }
  };

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
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Quản Lý Giống Nuôi</h1>

          <div className="flex items-center gap-4">
            {/* THANH TÌM KIẾM - Style đơn giản như BeNuoi */}
            <div className="relative w-96">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Tìm tên giống, nguồn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 outline-none"
              />
            </div>

            <button
              onClick={() => openPopup("create")}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold shadow-md shrink-0"
            >
              + Nhập Giống
            </button>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[60px]">STT</th>
                  <th className="py-3 px-4 text-left w-[180px]">Tên Giống</th>
                  <th className="py-3 px-4 text-center w-[100px]">Kích cỡ</th>
                  <th className="py-3 px-4 text-center w-[100px]">Số lượng</th>
                  <th className="py-3 px-4 text-right w-[150px]">Tổng Chi Phí</th>
                  <th className="py-3 px-4 text-center w-[150px]">Bể Nuôi</th>
                  <th className="py-3 px-4 text-center w-[120px]">Ngày Nhập</th>
                  <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((item, index) => {
                  const unitDisplay = (item.unit || 'con').toUpperCase();
                  return (
                    <tr key={item._id} className="border-b hover:bg-gray-100">
                      <td className="py-3 px-4 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-700 truncate" title={item.name}>{item.name}</td>
                      <td className="py-3 px-4 text-center font-medium">{item.sizeGrade} <span className="text-xs text-gray-500"></span></td>
                      <td className="py-3 px-4 text-center font-black text-blue-600">
                        {item.quantity} <span className="text-xs text-gray-500 font-normal">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(item.totalCost)}</td>
                      <td className="py-3 px-4 text-center truncate" title={item.tankId?.name}>{item.tankId?.name || '---'}</td>
                      <td className="py-3 px-4 text-center text-sm text-slate-500">{formatDate(item.importDate)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
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
                  );
                })}
                {filteredBatches.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-8 text-gray-500 italic">Không tìm thấy dữ liệu phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP */}
        {showPopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
            <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-xl relative max-h-[90vh] overflow-y-auto">

              {/* --- VIEW MODE --- */}
              {popupType === "view" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi Tiết Lô Giống</h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Tên giống:</strong> {selectedRecord.name}</p>
                    <p><strong>Kích cỡ:</strong> {selectedRecord.sizeGrade} (mẫu)</p>
                    <p><strong>Số lượng:</strong> <span className="text-blue-600 font-bold">{selectedRecord.quantity} {selectedRecord.unit || 'con'}</span></p>
                    <p><strong>Đơn giá:</strong> {formatCurrency(selectedRecord.pricePerUnit)}</p>
                    <p><strong>Tổng chi phí:</strong> <span className="text-red-600 font-bold">{formatCurrency(selectedRecord.totalCost)}</span></p>
                    <p><strong>Nguồn nhập:</strong> {selectedRecord.source || "Không rõ"}</p>
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
                  <form onSubmit={handleSubmit} className="space-y-3">

                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Tên giống lươn <span className="text-red-500">*</span></label>
                      <input type="text" name="name" placeholder="VD: Lươn Nhật F1" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" required />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex flex-col w-1/3">
                        <label className="text-sm font-bold text-gray-700 mb-1">Kích cỡ (Mẫu) <span className="text-red-500">*</span></label>
                        <input type="number" name="sizeGrade" placeholder="VD: 500" value={form.sizeGrade} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" required min="1" />
                      </div>
                      <div className="flex flex-col w-1/3">
                        <label className="text-sm font-bold text-gray-700 mb-1">Số lượng <span className="text-red-500">*</span></label>
                        <input type="number" name="quantity" placeholder="0" value={form.quantity} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" required min="1" />
                      </div>
                      <div className="flex flex-col w-1/3">
                        <label className="text-sm font-bold text-gray-700 mb-1">Đơn vị</label>
                        <select name="unit" value={form.unit} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none">
                          <option value="con">Con</option>
                          <option value="kg">Kg</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex flex-col w-1/2">
                        <label className="text-sm font-bold text-gray-700 mb-1">Đơn giá (VNĐ) <span className="text-red-500">*</span></label>
                        <input type="number" name="pricePerUnit" placeholder="0" value={form.pricePerUnit} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" required min="0" />
                      </div>
                      <div className="flex flex-col w-1/2">
                        <label className="text-sm font-bold text-gray-700 mb-1">Thành tiền (Tự tính)</label>
                        <input type="number" name="totalCost" placeholder="0" value={form.totalCost} onChange={handleChange} className="w-full border px-3 py-2 rounded bg-gray-100 font-bold text-green-700" readOnly />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Nguồn nhập (Trại/Thương lái)</label>
                      <input type="text" name="source" placeholder="VD: Trại giống A" value={form.source} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Chọn bể thả nuôi <span className="text-red-500">*</span></label>
                      <select name="tankId" value={form.tankId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" required>
                        <option value="">-- Chọn bể --</option>
                        {tanks.map((t) => {
                          // Logic vô hiệu hóa:
                          // 1. Nếu đang Thêm mới: Disable bể đang nuôi ('raising')
                          // 2. Nếu đang Sửa: Disable bể đang nuôi ('raising'), TRỪ bể hiện tại đang chọn (selectedRecord.tankId._id)
                          const isRaising = t.status === 'raising';
                          const isCurrentTank = popupType === 'edit' && selectedRecord && (t._id === selectedRecord.tankId?._id || t._id === selectedRecord.tankId);

                          const isDisabled = isRaising && !isCurrentTank;

                          return (
                            <option
                              key={t._id}
                              value={t._id}
                              disabled={isDisabled}
                              className={isDisabled ? "text-gray-400 bg-gray-100" : "text-black"}
                            >
                              {t.name} ({t.status === 'empty' ? 'Trống' : 'Đang nuôi'}) {isDisabled ? '- Đã có lươn' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Ngày nhập giống</label>
                      <input type="date" name="importDate" value={form.importDate} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" required />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Ghi chú thêm</label>
                      <textarea name="notes" placeholder="VD: Giống khỏe, hao hụt ít..." rows="2" value={form.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    <div className="flex space-x-3 pt-4 border-t mt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        {popupType === "create" ? "Lưu Lại" : "Cập Nhật"}
                      </button>
                      <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
                    </div>
                  </form>
                </>
              )}

              {/* --- DELETE MODE --- */}
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa Lô Giống?</h2>
                  <p className="mb-4 text-gray-700">Bạn có chắc chắn muốn xóa lô <strong>{selectedRecord.name}</strong>?<br /><span className="text-sm text-red-500 italic font-bold">⚠️ Lưu ý: Hành động này sẽ RESET bể nuôi {selectedRecord.tankId?.name} về trạng thái TRỐNG!</span></p>
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