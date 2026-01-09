import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";
export default function HarvestManager() {
  // --- API ---
  const API_HARVEST = "http://localhost:5000/api/XuatBan";
  const API_TANK = "http://localhost:5000/api/tank";
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

  // --- State ---
  const [harvests, setHarvests] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Thêm State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

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
  const filteredHarvests = harvests.filter((item) => {
    if (!searchTerm) return true;
    const lowerTerm = removeAccents(searchTerm);
    
    // Tìm theo Tên bể, Tên người mua, Ghi chú, Loại bán
    const typeSale = item.isFinalHarvest ? "tat ao" : "ban tia";
    
    return (
        removeAccents(item.tankId?.name || "").includes(lowerTerm) ||
        removeAccents(item.buyerName || "").includes(lowerTerm) ||
        removeAccents(item.notes || "").includes(lowerTerm) ||
        typeSale.includes(lowerTerm) ||
        // Tìm theo số liệu (chuyển sang chuỗi để tìm)
        (item.totalWeight && item.totalWeight.toString().includes(lowerTerm)) ||
        (item.quantitySold && item.quantitySold.toString().includes(lowerTerm)) ||
        (item.totalRevenue && item.totalRevenue.toString().includes(lowerTerm))
    );
  });

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handle Input & Auto Calculate ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    if (['totalWeight', 'totalRevenue', 'quantitySold', 'pricePerKg'].includes(name)) {
        processedValue = value === "" ? "" : Number(value);
    }

    setForm(prev => {
        const newForm = { ...prev, [name]: processedValue };
        
        // Tự động tính Thành tiền
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
      // Tính ngược lại đơn giá
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
      // Demo fallback
      fetchData();
      closePopup();
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_HARVEST}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa phiếu bán thành công");
      fetchData();
      closePopup();
    } catch (err) {
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
        
        {/* HEADER & THANH TÌM KIẾM */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-600 shrink-0">Quản Lý Xuất Bán</h1>
          
          <div className="flex w-full md:w-auto gap-3 items-center">
             {/* THANH TÌM KIẾM */}
             <div className="relative flex-1 md:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Tìm bể, người mua, ghi chú..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 outline-none"
                />
            </div>

            <button
                onClick={() => openPopup("create")}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shrink-0 shadow-md font-bold flex items-center"
            >
                <span className="mr-1 text-xl">+</span> Xuất Bán
            </button>
          </div>
        </div>

        {/* TABLE (Thêm table-fixed) */}
        {loading ? (
          <p className="text-center text-gray-600">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[60px]">STT</th>
                  <th className="py-3 px-4 text-left w-[150px]">Bể bán</th>
                  <th className="py-3 px-4 text-left w-[180px]">Người mua</th>
                  <th className="py-3 px-4 text-center w-[100px]">Trọng lượng</th>
                  <th className="py-3 px-4 text-center w-[80px]">Số con</th>
                  <th className="py-3 px-4 text-right w-[150px]">Doanh thu</th>
                  <th className="py-3 px-4 text-center w-[100px]">Loại</th>
                  <th className="py-3 px-4 text-center w-[120px]">Ngày bán</th>
                  <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHarvests.map((item, index) => (
                  <tr key={item._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4 font-medium truncate" title={item.tankId?.name}>{item.tankId?.name || '---'}</td>
                    <td className="py-3 px-4 truncate" title={item.buyerName}>{item.buyerName}</td>
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
                      <button onClick={() => openPopup("view", item)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition shadow-sm" title="Xem">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => openPopup("edit", item)} className="p-1.5 bg-amber-100 text-amber-600 rounded-md hover:bg-amber-200 transition shadow-sm" title="Sửa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => openPopup("delete", item)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition shadow-sm" title="Xóa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </td>
                  </tr>
                ))}
                {filteredHarvests.length === 0 && (
                  <tr><td colSpan="9" className="text-center p-8 text-gray-500 italic">Không tìm thấy phiếu bán phù hợp.</td></tr>
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