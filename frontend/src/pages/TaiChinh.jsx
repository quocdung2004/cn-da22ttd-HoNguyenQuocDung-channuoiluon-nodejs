import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Đăng ký các thành phần Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function FinanceManager() {
  // --- Cấu hình API và Token ---
  const API_FINANCE = "http://localhost:5000/api/taichinh";
  const API_TANK = "http://localhost:5000/api/tank"; 
  const token = localStorage.getItem("token");

  // --- State Quản lý dữ liệu và UI ---
  const [records, setRecords] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [form, setForm] = useState({
    tankId: "",
    type: "cost",
    amount: "", 
    description: "", 
  });

  // --- Hàm xử lý chung ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "amount") {
      processedValue = value === "" ? "" : Number(value);
    }
    
    setForm((prevForm) => ({
      ...prevForm,
      [name]: processedValue,
    }));
  };

  const formatCurrency = (amount) => {
    return amount ? amount.toLocaleString('vi-VN') + ' VND' : '0 VND';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "---";
    const options = {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // --- Chức năng Load Data ---

  const fetchTanks = async () => {
    try {
      const res = await axios.get(API_TANK, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTanks(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bể:", err);
      alert("Lỗi khi lấy danh sách bể"); 
    }
  };

  const fetchFinanceRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_FINANCE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu tài chính:", err);
      alert("Lỗi khi lấy dữ liệu tài chính");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTanks();
    fetchFinanceRecords();
  }, []);

  // --- Logic Biểu đồ (Sử dụng useMemo để tính toán hiệu quả) ---
  const { totalRevenue, totalCost, netProfit, chartData } = useMemo(() => {
    let revenue = 0;
    let cost = 0;

    records.forEach(record => {
      if (record.type === 'revenue') {
        revenue += record.amount;
      } else if (record.type === 'cost') {
        cost += record.amount;
      }
    });

    const net = revenue - cost;

    const data = {
        labels: ['Tổng Doanh thu', 'Tổng Chi phí'],
        datasets: [
          {
            data: [revenue, cost],
            backgroundColor: [
              'rgba(52, 211, 106, 0.8)', // Xanh lá cây cho Revenue
              'rgba(239, 68, 68, 0.8)',  // Đỏ cho Cost
            ],
            borderColor: [
              'rgba(52, 211, 106, 1)',
              'rgba(239, 68, 68, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

    return { totalRevenue: revenue, totalCost: cost, netProfit: net, chartData: data };
  }, [records]); // Chỉ tính toán lại khi danh sách records thay đổi

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 14 } }
      },
      title: {
        display: true,
        text: 'Tỷ lệ Thu/Chi',
        font: { size: 16 }
      }
    },
  };

  // --- Chức năng Quản lý Popup (openPopup, closePopup, handleSubmit, handleDelete) ---
  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    setForm(
      record
        ? {
            tankId: record.tankId?._id || record.tankId || "",
            type: record.type,
            amount: record.amount,
            description: record.description,
          }
        : { tankId: "", type: "cost", amount: "", description: "" }
    );

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType("");
    setSelectedRecord(null);
    setForm({ tankId: "", type: "cost", amount: "", description: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tankId) { alert("Vui lòng chọn bể nuôi"); return; }
    
    const dataToSend = { ...form, amount: Number(form.amount) };
    if (!dataToSend.description) delete dataToSend.description;

    try {
      if (popupType === "edit") {
        await axios.put(`${API_FINANCE}/${selectedRecord._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Cập nhật giao dịch thành công");
      } else {
        await axios.post(API_FINANCE, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Thêm mới giao dịch thành công");
      }
      fetchFinanceRecords(); // Re-fetch data để cập nhật bảng và biểu đồ
      closePopup();
    } catch (err) {
      console.error("LỖI GỬI API:", err.response?.data || err.message);
      alert(`Có lỗi xảy ra: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_FINANCE}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa giao dịch thành công");
      fetchFinanceRecords();
      closePopup();
    } catch (err) {
      console.error("Lỗi xóa bản ghi:", err);
      alert("Xóa thất bại");
    }
  };

  // --- Phần Render Component ---
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Quản lý Tài Chính & Báo Cáo</h1>
          <button
            onClick={() => openPopup("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Thêm Giao dịch
          </button>
        </div>

        {/* --- PHẦN BÁO CÁO THỐNG KÊ --- */}
        <section className="mb-10 p-5 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">📊 Báo cáo Tổng quan</h2>
            
            {/* Cards Thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-600">
                    <p className="text-green-800 font-medium">Tổng Doanh thu</p>
                    <h3 className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</h3>
                </div>
                
                <div className="bg-red-100 p-4 rounded-lg border-l-4 border-red-600">
                    <p className="text-red-800 font-medium">Tổng Chi phí</p>
                    <h3 className="text-xl font-bold text-red-600">{formatCurrency(totalCost)}</h3>
                </div>

                <div className={`p-4 rounded-lg border-l-4 ${netProfit >= 0 ? 'bg-blue-100 border-blue-600' : 'bg-yellow-100 border-yellow-600'}`}>
                    <p className="font-medium text-gray-700">Lợi nhuận Ròng</p>
                    <h3 className="text-xl font-bold" style={{ color: netProfit >= 0 ? '#3b82f6' : '#d97706' }}>
                        {formatCurrency(Math.abs(netProfit))}
                        {netProfit >= 0 ? ' (Lãi)' : ' (Lỗ)'}
                    </h3>
                </div>
            </div>

            {/* Biểu đồ */}
            {totalRevenue > 0 || totalCost > 0 ? (
                <div className="w-full max-w-sm mx-auto p-4 border rounded-lg">
                    <Doughnut data={chartData} options={chartOptions} />
                </div>
            ) : (
                <p className="text-center text-gray-500 italic mt-4">Chưa có đủ dữ liệu thu chi để vẽ biểu đồ.</p>
            )}
        </section>

        <hr className="my-6" />

        {/* --- PHẦN QUẢN LÝ DỮ LIỆU (BẢNG) --- */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Danh sách Giao dịch</h2>
        
        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center">STT</th>
                  <th className="py-3 px-4">Bể</th>
                  <th className="py-3 px-4 text-center">Loại</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4 text-center">Thời gian</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4">{record.tankId?.name}</td>
                    <td 
                        className={`py-3 px-4 text-center font-bold ${
                            record.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                        }`}
                    >
                      {record.type === 'revenue' ? 'Thu' : 'Chi'}
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(record.amount)}</td>
                    <td className="py-3 px-4">{record.description || '---'}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatDateTime(record.recordedAt)}</td>
                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button onClick={() => openPopup("view", record)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">Xem</button>
                      <button onClick={() => openPopup("edit", record)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500">Sửa</button>
                      <button onClick={() => openPopup("delete", record)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center p-4">Không có giao dịch tài chính nào được ghi nhận.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP (Không thay đổi) */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">

              {/* VIEW */}
              {popupType === "view" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">Chi tiết Giao dịch</h2>
                  <p><strong>Bể:</strong> {selectedRecord.tankId?.name}</p>
                  <p><strong>Loại:</strong> <span className={`font-bold ${selectedRecord.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>{selectedRecord.type === 'revenue' ? ' Thu (Revenue)' : ' Chi (Cost)'}</span></p>
                  <p><strong>Số tiền:</strong> {formatCurrency(selectedRecord.amount)}</p>
                  <p><strong>Mô tả:</strong> {selectedRecord.description || 'Không có'}</p>
                  <p><strong>Thời gian:</strong> {formatDateTime(selectedRecord.recordedAt)}</p>
                  <button onClick={closePopup} className="mt-4 w-full bg-blue-600 text-white py-2 rounded">Đóng</button>
                </>
              )}

              {/* CREATE / EDIT */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">{popupType === "create" ? "Thêm mới Giao dịch" : "Cập nhật Giao dịch"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <select className="w-full border px-3 py-2 rounded" name="tankId" value={form.tankId} onChange={handleChange} required>
                      <option value="">-- Chọn bể nuôi --</option>
                      {tanks.map((t) => (<option key={t._id} value={t._id}>{t.name} ({t.type})</option>))}
                    </select>
                    <select className="w-full border px-3 py-2 rounded" name="type" value={form.type} onChange={handleChange} required>
                      <option value="cost">Chi phí (Cost)</option>
                      <option value="revenue">Doanh thu (Revenue)</option>
                    </select>
                    <input type="number" name="amount" placeholder="Số tiền (VND)" className="w-full border px-3 py-2 rounded" value={form.amount} onChange={handleChange} required />
                    <textarea name="description" placeholder="Mô tả chi tiết (Tùy chọn)" rows="3" className="w-full border px-3 py-2 rounded" value={form.description} onChange={handleChange} />
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{popupType === "create" ? "Thêm mới" : "Cập nhật"}</button>
                  </form>
                  <button onClick={closePopup} className="mt-3 w-full bg-gray-300 py-2 rounded hover:bg-gray-400">Hủy</button>
                </>
              )}

              {/* DELETE */}
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Xóa Giao dịch?</h2>
                  <p>Bạn có chắc muốn xóa giao dịch **{selectedRecord.type === 'revenue' ? 'Thu' : 'Chi'}** **{formatCurrency(selectedRecord.amount)}**?</p>
                  <button onClick={handleDelete} className="mt-4 w-full bg-red-600 text-white py-2 rounded">Xóa</button>
                  <button onClick={closePopup} className="mt-3 w-full bg-gray-300 py-2 rounded hover:bg-gray-400">Hủy</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}