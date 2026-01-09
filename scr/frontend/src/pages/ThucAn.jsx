import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";
export default function FoodManager() {
  // --- API ---
  const API_URL = "http://localhost:5000/api/ThucAn"; 
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

  // --- State ---
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Thêm State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

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
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');
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
  const filteredFoods = foods.filter((item) => {
    if (!searchTerm) return true;
    const lowerTerm = removeAccents(searchTerm);
    
    // Tìm theo Tên, Loại, Nguồn gốc, Ghi chú
    return (
        removeAccents(item.name).includes(lowerTerm) ||
        removeAccents(item.type).includes(lowerTerm) ||
        removeAccents(item.source || "").includes(lowerTerm) ||
        removeAccents(item.supplierName || "").includes(lowerTerm)
    );
  });

  // --- Fetch Data ---
  const fetchFoods = useCallback(async () => {
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
      // Demo fallback
      fetchFoods();
      closePopup();
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

  if (!token) {
    return (
      <Layout>
        <div className="text-center py-10 text-red-600 text-xl">
          Bạn chưa đăng nhập!
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        
        {/* 4. HEADER & THANH TÌM KIẾM (Được cập nhật) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-600 shrink-0">Quản Lý Kho Thức Ăn</h1>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             {/* THANH TÌM KIẾM */}
             <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Tìm thức ăn, loại, nguồn..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 outline-none"
                />
            </div>

            <button
                onClick={() => openPopup("create")}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shrink-0 shadow-md font-bold flex items-center"
            >
                <span className="mr-1 text-xl">+</span> Nhập Thức Ăn
            </button>
          </div>
        </div>

        {/* 5. TABLE (Thêm table-fixed để không bị giật) */}
        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[60px]">STT</th>
                  <th className="py-3 px-4 text-left w-[180px]">Tên thức ăn</th>
                  <th className="py-3 px-4 text-center w-[120px]">Loại</th>
                  <th className="py-3 px-4 text-center w-[80px]">Đạm</th>
                  <th className="py-3 px-4 text-center w-[100px]">Tồn kho</th>
                  <th className="py-3 px-4 text-right w-[120px]">Giá nhập</th>
                  <th className="py-3 px-4 text-right w-[150px]">Tổng tiền</th> 
                  <th className="py-3 px-4 text-center w-[120px]">Hạn SD</th>
                  <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.map((item, index) => (
                  <tr key={item._id} className="border-b hover:bg-gray-100 h-[60px]">
                    <td className="py-3 px-4 text-center text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4 font-medium truncate" title={item.name}>{item.name}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600 truncate">{item.type}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{item.protein ? item.protein + '%' : '-'}</td>
                    <td className={`py-3 px-4 text-center font-bold ${item.currentStock < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.currentStock} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{formatCurrency(item.pricePerUnit)}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(item.totalCost)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatDate(item.expiryDate)}</td>
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
                ))}
                {filteredFoods.length === 0 && (
                  <tr><td colSpan="9" className="text-center p-8 text-gray-500 italic">Không tìm thấy dữ liệu phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP (Giữ nguyên như cũ) */}
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