import { useEffect, useState, useMemo } from "react";
import axios from "axios";
// ⚠️ KHI CHẠY DỰ ÁN THẬT: Bỏ chú thích dòng dưới đây để dùng Layout chuẩn
import Layout from "../components/Layout"; 

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Đăng ký các thành phần biểu đồ
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function FinanceManager() {
  // --- 1. CẤU HÌNH API (THEO ĐÚNG ROUTE CỦA BẠN) ---
  const API_SEED = "http://localhost:5000/api/GiongLuon";        // Chi phí Giống
  const API_FOOD = "http://localhost:5000/api/ThucAn";           // Chi phí Thức ăn (Nhập kho)
  const API_MEDICINE = "http://localhost:5000/api/Thuoc";        // Chi phí Thuốc (Nhập kho)
  const API_EXPENSE = "http://localhost:5000/api/ChiPhiVanHanh"; // Chi phí Vận hành (Điện/Nước/Khác)
  const API_HARVEST = "http://localhost:5000/api/XuatBan";       // Doanh thu (Xuất bán)
  const API_TANK = "http://localhost:5000/api/tank";             // Bể nuôi
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // --- 2. STATE ---
  const [data, setData] = useState({
    seeds: [],
    foods: [],
    medicines: [],
    expenses: [],
    harvests: [],
    tanks: []
  });
  const [loading, setLoading] = useState(false);
  
  // Quản lý giao diện: 'dashboard' hoặc 'detail'
  const [viewMode, setViewMode] = useState('dashboard');
  // ✅ SỬA LỖI: Đổi tên state thành detailData để khớp với phần sử dụng bên dưới
  const [detailData, setDetailData] = useState(null);

  // --- 3. HELPERS ---
  const formatCurrency = (val) => val?.toLocaleString('vi-VN') + ' VND';
  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

  // --- 4. FETCH DATA ---
  const fetchAllData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      // Gọi song song 6 API để lấy dữ liệu (Bỏ NhatKyThu vì bạn không dùng)
      const [resSeed, resFood, resMed, resExp, resHar, resTank] = await Promise.all([
        axios.get(API_SEED, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_FOOD, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_MEDICINE, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_EXPENSE, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_HARVEST, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setData({
        seeds: resSeed.data,
        foods: resFood.data,
        medicines: resMed.data,
        expenses: resExp.data,
        harvests: resHar.data,
        tanks: resTank.data
      });
    } catch (err) {
      console.error("Lỗi tải dữ liệu tài chính:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- 5. XỬ LÝ LOGIC TÀI CHÍNH (Aggregation) ---
  const financeStats = useMemo(() => {
    const { seeds, foods, medicines, expenses, harvests, tanks } = data;

    let totalRev = 0;
    let totalExp = 0;
    let costBreakdown = { seed: 0, food: 0, medicine: 0, operation: 0 };

    // Khởi tạo báo cáo cho từng bể
    const tankReports = {}; 
    tanks.forEach(t => {
      tankReports[t._id] = {
        id: t._id,
        name: t.name,
        revenue: 0,
        cost: 0,
        history: [] // Lưu lịch sử giao dịch
      };
    });

    // Khởi tạo báo cáo chung
    const generalReport = {
      id: 'general',
      name: 'Hoạt động Chung (Kho & Vận hành)',
      revenue: 0,
      cost: 0,
      history: []
    };

    // --- BƯỚC 5.1: TÍNH CHI PHÍ (TIỀN RA) ---

    // A. Giống lươn (Gắn với Bể)
    seeds.forEach(item => {
      const val = item.totalCost || 0;
      totalExp += val;
      costBreakdown.seed += val;
      
      const tId = item.tankId?._id || item.tankId;
      const trans = { date: item.importDate, type: 'chi', cat: 'Con Giống', desc: `Nhập: ${item.name}`, amount: val };

      if (tId && tankReports[tId]) {
        tankReports[tId].cost += val;
        tankReports[tId].history.push(trans);
      } else {
        generalReport.cost += val;
        generalReport.history.push(trans);
      }
    });

    // B. Thức ăn (Nhập kho -> Tính vào Chi chung)
    foods.forEach(item => {
      const val = item.totalCost || 0;
      totalExp += val;
      costBreakdown.food += val;
      generalReport.cost += val;
      generalReport.history.push({ date: item.importDate, type: 'chi', cat: 'Thức ăn', desc: `Nhập kho: ${item.name}`, amount: val });
    });

    // C. Thuốc (Nhập kho -> Tính vào Chi chung)
    medicines.forEach(item => {
      const val = item.totalCost || 0;
      totalExp += val;
      costBreakdown.medicine += val;
      generalReport.cost += val;
      generalReport.history.push({ date: item.importDate, type: 'chi', cat: 'Thuốc', desc: `Nhập kho: ${item.name}`, amount: val });
    });

    // D. Chi phí vận hành (Điện/Nước... -> Có thể chung hoặc riêng)
    expenses.forEach(item => {
      const val = item.amount || 0;
      totalExp += val;
      costBreakdown.operation += val;
      
      const tId = item.relatedTankId?._id || item.relatedTankId;
      const trans = { date: item.date, type: 'chi', cat: 'Vận hành', desc: `${item.type}: ${item.name}`, amount: val };

      if (tId && tankReports[tId]) {
        tankReports[tId].cost += val;
        tankReports[tId].history.push(trans);
      } else {
        generalReport.cost += val;
        generalReport.history.push(trans);
      }
    });

    // --- BƯỚC 5.2: TÍNH DOANH THU (TIỀN VÀO) ---

    // E. Xuất bán (Harvest - Nguồn thu chính)
    harvests.forEach(item => {
      const val = item.totalRevenue || 0;
      totalRev += val;
      
      const tId = item.tankId?._id || item.tankId;
      const trans = { date: item.saleDate, type: 'thu', cat: 'Bán lươn', desc: `Khách: ${item.buyerName}`, amount: val };

      if (tId && tankReports[tId]) {
        tankReports[tId].revenue += val;
        tankReports[tId].history.push(trans);
      } else {
        generalReport.revenue += val;
        generalReport.history.push(trans);
      }
    });

    // --- BƯỚC 5.3: SẮP XẾP & CHUẨN BỊ DỮ LIỆU CHART ---
    
    // Sort history by date desc
    Object.values(tankReports).forEach(r => r.history.sort((a, b) => new Date(b.date) - new Date(a.date)));
    generalReport.history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Chart 1: Cơ cấu chi phí
    const chartDataPie = {
      labels: ['Con Giống', 'Thức ăn', 'Thuốc', 'Vận hành'],
      datasets: [{
        data: [costBreakdown.seed, costBreakdown.food, costBreakdown.medicine, costBreakdown.operation],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 1,
      }],
    };

    // Chart 2: Cân đối Thu - Chi
    const chartDataBar = {
        labels: ['Tổng quan Tài chính'],
        datasets: [
            { label: 'Tổng Thu', data: [totalRev], backgroundColor: '#22c55e' },
            { label: 'Tổng Chi', data: [totalExp], backgroundColor: '#ef4444' }
        ]
    };

    return {
      totalRevenue: totalRev,
      totalCost: totalExp,
      netProfit: totalRev - totalExp,
      costBreakdown,
      reportByTank: tankReports,
      reportGeneral: generalReport,
      chartDataPie,
      chartDataBar
    };
  }, [data]);

  // --- Handlers ---
  const handleViewDetail = (data) => { setDetailData(data); setViewMode('detail'); };
  const handleBack = () => { setViewMode('dashboard'); setDetailData(null); };

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800">
            {/* ✅ SỬA LỖI: Dùng detailData thay vì selectedDetail */}
            {viewMode === 'dashboard' ? 'Báo Cáo Tài Chính Toàn Trại' : `Chi Tiết: ${detailData?.name}`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {viewMode === 'dashboard' ? 'Tổng hợp tự động từ: Kho, Giống, Vận hành và Xuất bán' : 'Lịch sử dòng tiền chi tiết'}
          </p>
        </div>

        {loading ? (
            <div className="text-center py-20 text-gray-500">Đang tổng hợp dữ liệu...</div>
        ) : (
          <>
            {/* ==================== DASHBOARD MODE ==================== */}
            {viewMode === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* 1. KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Tổng Doanh Thu</p>
                    <h2 className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(financeStats.totalRevenue)}</h2>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Tổng Chi Phí</p>
                    <h2 className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(financeStats.totalCost)}</h2>
                    <div className="mt-3 text-xs text-gray-400 flex flex-wrap gap-2">
                       <span>📦 Kho: {(( (financeStats.costBreakdown.food + financeStats.costBreakdown.medicine)/financeStats.totalCost)*100 || 0).toFixed(0)}%</span>
                       <span>🌱 Giống: {((financeStats.costBreakdown.seed/financeStats.totalCost)*100 || 0).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${financeStats.netProfit >= 0 ? 'border-blue-500' : 'border-yellow-500'}`}>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Lợi Nhuận Ròng</p>
                    <h2 className={`text-3xl font-bold mt-2 ${financeStats.netProfit >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                      {formatCurrency(financeStats.netProfit)}
                    </h2>
                    <span className={`mt-2 inline-block text-xs font-bold px-2 py-1 rounded ${financeStats.netProfit >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {financeStats.netProfit >= 0 ? 'KINH DOANH CÓ LÃI' : 'ĐANG BÙ LỖ'}
                    </span>
                  </div>
                </div>

                {/* 2. CHARTS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center">
                        <h3 className="font-bold text-gray-700 mb-4 text-center">Cơ Cấu Chi Phí Đầu Vào</h3>
                        <div className="h-64 w-full flex justify-center">
                            <Doughnut data={financeStats.chartDataPie} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center">
                        <h3 className="font-bold text-gray-700 mb-4 text-center">Cân Đối Thu - Chi</h3>
                        <div className="h-64 w-full">
                             <Bar data={financeStats.chartDataBar} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                    </div>
                </div>

                {/* 3. DETAIL LISTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* A. HOẠT ĐỘNG CHUNG */}
                    <div className="bg-white rounded-xl shadow overflow-hidden h-fit">
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">🏢 Hoạt động Chung</h3>
                            <button onClick={() => handleViewDetail(financeStats.reportGeneral)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">Xem chi tiết</button>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between mb-2 border-b border-dashed pb-2">
                                <span>Tổng chi mua hàng (Thức ăn/Thuốc):</span> 
                                <span className="font-bold text-red-600">{formatCurrency(financeStats.costBreakdown.food + financeStats.costBreakdown.medicine)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span>Chi phí vận hành chung:</span> 
                                <span className="font-bold text-red-600">{formatCurrency(financeStats.reportGeneral.cost - (financeStats.costBreakdown.food + financeStats.costBreakdown.medicine))}</span>
                            </div>
                        </div>
                    </div>

                    {/* B. HIỆU QUẢ TỪNG BỂ */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b-2 border-blue-200 pb-2 inline-block">
                           Hiệu quả từng Bể nuôi
                        </h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {Object.values(financeStats.reportByTank).map(tank => {
                                const net = tank.revenue - tank.cost;
                                return (
                                    <div key={tank.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${net >= 0 ? 'border-blue-500' : 'border-yellow-500'} flex justify-between items-center hover:shadow-md transition`}>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{tank.name}</h4>
                                            <div className="text-sm mt-1 space-y-1">
                                                <p className="text-gray-600">Thu (Bán lươn): <span className="font-bold text-green-600">{formatCurrency(tank.revenue)}</span></p>
                                                <p className="text-gray-600">Chi (Giống + Riêng): <span className="font-bold text-red-600">{formatCurrency(tank.cost)}</span></p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 uppercase">Lãi/Lỗ</p>
                                            <p className={`text-lg font-bold ${net >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                                {formatCurrency(net)}
                                            </p>
                                            <button onClick={() => handleViewDetail(tank)} className="text-xs text-blue-500 underline mt-1 hover:text-blue-700">Lịch sử</button>
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(financeStats.reportByTank).length === 0 && <p className="text-center text-gray-500 italic">Chưa có bể nuôi nào.</p>}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* ==================== DETAIL VIEW ==================== */}
            {viewMode === 'detail' && detailData && (
                <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-blue-800">{detailData.name}</h2>
                            <p className="text-gray-500 text-sm">Lịch sử dòng tiền chi tiết</p>
                        </div>
                        <button onClick={handleBack} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium">
                            ← Quay lại Tổng quan
                        </button>
                    </div>
                    
                    {/* Summary Mini Bar */}
                    <div className="flex gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Tổng Thu</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(detailData.revenue)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Tổng Chi</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(detailData.cost)}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-xs text-gray-500 uppercase">Kết quả</p>
                            <p className={`text-xl font-bold ${detailData.revenue - detailData.cost >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                {formatCurrency(detailData.revenue - detailData.cost)}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-blue-50 text-blue-800 border-b border-blue-100">
                                    <th className="p-3 text-center w-32">Ngày</th>
                                    <th className="p-3 text-center w-24">Loại</th>
                                    <th className="p-3 text-center w-32">Danh mục</th>
                                    <th className="p-3">Nội dung chi tiết</th>
                                    <th className="p-3 text-right w-40">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailData.history.map((item, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                                        <td className="p-3 text-center text-gray-600">{formatDate(item.date)}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'thu' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center font-medium text-gray-700">{item.cat}</td>
                                        <td className="p-3 text-gray-800">{item.desc}</td>
                                        <td className={`p-3 text-right font-bold text-base ${item.type === 'thu' ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.type === 'thu' ? '+' : '-'}{formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {detailData.history.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-400">Chưa có giao dịch nào phát sinh.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}