import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { 
  Users, Droplets, AlertTriangle, TrendingUp, 
  Package, Activity, ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const THRESHOLDS = {
      pH: { min: 6.0, max: 8.5 },           // pH chuẩn: 6.0 - 8.5
      temperature: { min: 25, max: 33 },    // Nhiệt độ chuẩn: 25 - 33 độ C
      oxygen: { min: 3.0 },                 // Oxy tối thiểu: 3.0 mg/L
      turbidity: { max: 50 }                // Độ đục tối đa: 50 NTU (Ví dụ)
  };

  // --- API ---
  const API_TANK = "http://localhost:5000/api/tank";
  const API_FOOD = "http://localhost:5000/api/ThucAn";
  const API_MEDICINE = "http://localhost:5000/api/Thuoc";
  const API_ENV = "http://localhost:5000/api/MoiTruong";

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  const [data, setData] = useState({
    tanks: [],
    foods: [],
    medicines: [],
    environments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
          setData({
              tanks: [
                  { _id: '1', name: 'Bể số 1', status: 'raising', currentQuantity: 2000 },
                  { _id: '2', name: 'Bể số 2', status: 'empty', currentQuantity: 0 },
                  { _id: '3', name: 'Bể số 3', status: 'raising', currentQuantity: 1500 }
              ],
              foods: [
                  { _id: 'f1', name: 'Cám 40 đạm', currentStock: 50, unit: 'kg' },
                  { _id: 'f2', name: 'Trùn quế', currentStock: 5, unit: 'kg' } 
              ],
              medicines: [
                  { _id: 'm1', name: 'Vitamin C', currentStock: 20, unit: 'kg' },
                  { _id: 'm2', name: 'Thuốc tím', currentStock: 2, unit: 'lít' } 
              ],
              environments: [
                  { _id: 'e1', tankId: { _id: '1', name: 'Bể số 1' }, pH: 7.2, temperature: 29, oxygen: 5.5, turbidity: 10, recordedAt: new Date().toISOString() },
                  { _id: 'e2', tankId: { _id: '3', name: 'Bể số 3' }, pH: 8.8, temperature: 31, oxygen: 2.5, turbidity: 20, recordedAt: new Date().toISOString() } // Alert: pH cao, Oxy thấp
              ]
          });
          setLoading(false);
          return;
      }

      try {
        const [resTank, resFood, resMed, resEnv] = await Promise.all([
          axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_FOOD, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_MEDICINE, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_ENV, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setData({
          tanks: resTank.data,
          foods: resFood.data,
          medicines: resMed.data,
          environments: resEnv.data
        });
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token]);

  // --- LOGIC PHÂN TÍCH & CẢNH BÁO ---
  const stats = useMemo(() => {
    // 1. Thống kê Bể
    const totalTanks = data.tanks.length;
    const activeTanks = data.tanks.filter(t => t.status === 'raising').length;
    const totalEels = data.tanks.reduce((sum, t) => sum + (t.currentQuantity || 0), 0);

    // 2. Cảnh báo Kho (Dưới 10 đơn vị được coi là thấp - Có thể tùy chỉnh)
    const lowStockFoods = data.foods.filter(f => f.currentStock <= 10);
    const lowStockMeds = data.medicines.filter(m => m.currentStock <= 5);

    // 3. Cảnh báo Môi trường (Lấy mẫu đo mới nhất của từng bể)
    const envAlerts = [];
    const latestEnvByTank = {};

    // Tìm bản ghi mới nhất cho mỗi bể
    data.environments.forEach(env => {
      const tId = env.tankId?._id || env.tankId;
      if (!latestEnvByTank[tId] || new Date(env.recordedAt) > new Date(latestEnvByTank[tId].recordedAt)) {
        latestEnvByTank[tId] = env;
      }
    });

    // So sánh với TIÊU CHUẨN (THRESHOLDS)
    Object.values(latestEnvByTank).forEach(env => {
      const tankName = env.tankId?.name || "Bể không tên";

      // Kiểm tra pH
      if (env.pH < THRESHOLDS.pH.min || env.pH > THRESHOLDS.pH.max) {
        envAlerts.push({ 
            tank: tankName, 
            issue: `pH bất thường (${env.pH})`, 
            detail: `Chuẩn: ${THRESHOLDS.pH.min}-${THRESHOLDS.pH.max}`,
            type: 'danger' 
        });
      }
      // Kiểm tra Nhiệt độ
      if (env.temperature < THRESHOLDS.temperature.min || env.temperature > THRESHOLDS.temperature.max) {
        envAlerts.push({ 
            tank: tankName, 
            issue: `Nhiệt độ báo động (${env.temperature}°C)`, 
            detail: `Chuẩn: ${THRESHOLDS.temperature.min}-${THRESHOLDS.temperature.max}°C`,
            type: 'warning' 
        });
      }
      // Kiểm tra Oxy
      if (env.oxygen < THRESHOLDS.oxygen.min) {
        envAlerts.push({ 
            tank: tankName, 
            issue: `Oxy thấp (${env.oxygen} mg/L)`, 
            detail: `Tối thiểu: ${THRESHOLDS.oxygen.min} mg/L`,
            type: 'danger' 
        });
      }
    });

    return { totalTanks, activeTanks, totalEels, lowStockFoods, lowStockMeds, envAlerts };
  }, [data]);

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Tổng Quan Trang Trại</h1>
            <p className="text-gray-500 mt-1">Xin chào, đây là tình hình hoạt động hôm nay.</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-600">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {loading ? (
            <div className="flex justify-center h-64 items-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. KPI CARDS (Thống kê nhanh) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Bể Đang Nuôi</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.activeTanks} <span className="text-sm text-gray-400 font-normal">/ {stats.totalTanks}</span></h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Tổng Đàn Lươn</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.totalEels.toLocaleString()} <span className="text-sm font-normal">con</span></h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Cảnh Báo Kho</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {stats.lowStockFoods.length + stats.lowStockMeds.length} <span className="text-sm font-normal">mục</span>
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Cảnh Báo Nước</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.envAlerts.length} <span className="text-sm font-normal">vấn đề</span></h3>
                </div>
              </div>
            </div>

            {/* 2. KHU VỰC CẢNH BÁO & HOẠT ĐỘNG */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Cột Trái: Cảnh báo Môi trường & Kho (Chiếm 2 phần) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Cảnh báo Môi trường */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Droplets size={20} className="text-blue-500"/> Chất Lượng Nước (Cần Chú Ý)
                    </h3>
                    <Link to="/MoiTruong" className="text-sm text-blue-600 hover:underline">Xem tất cả</Link>
                  </div>
                  <div className="p-4">
                    {stats.envAlerts.length > 0 ? (
                      <div className="space-y-3">
                        {stats.envAlerts.map((alert, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${alert.type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <div className="flex items-center gap-2">
                                <AlertTriangle size={18} />
                                <span className="font-semibold">{alert.tank}:</span>
                              </div>
                              <div className="flex flex-col">
                                <span>{alert.issue}</span>
                                <span className="text-xs opacity-75">{alert.detail}</span>
                              </div>
                            </div>
                            <Link to="/MoiTruong" className="text-sm underline whitespace-nowrap ml-2">Xử lý</Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-green-600 flex flex-col items-center">
                        <div className="bg-green-100 p-3 rounded-full mb-2"><TrendingUp size={24}/></div>
                        <p>Môi trường nước ổn định. Không có cảnh báo!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cảnh báo Tồn kho */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Package size={20} className="text-orange-500"/> Sắp Hết Hàng
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Thức ăn sắp hết */}
                     <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Thức ăn</h4>
                        {stats.lowStockFoods.length > 0 ? (
                            <ul className="space-y-2">
                                {stats.lowStockFoods.map(f => (
                                    <li key={f._id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                        <span>{f.name}</span>
                                        <span className="font-bold text-red-600">{f.currentStock} {f.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-400 italic">Đủ hàng.</p>}
                     </div>

                     {/* Thuốc sắp hết */}
                     <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Thuốc</h4>
                        {stats.lowStockMeds.length > 0 ? (
                            <ul className="space-y-2">
                                {stats.lowStockMeds.map(m => (
                                    <li key={m._id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                        <span>{m.name}</span>
                                        <span className="font-bold text-red-600">{m.currentStock} {m.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-400 italic">Đủ hàng.</p>}
                     </div>
                  </div>
                </div>

              </div>

              {/* Cột Phải: Lối tắt (Quick Actions) */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 text-white">
                    <h3 className="font-bold text-lg mb-4">Thao tác nhanh</h3>
                    <div className="space-y-3">
                        <Link to="/NhatKyChoAn" className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition backdrop-blur-sm cursor-pointer">
                            <span className="flex items-center gap-2"><Package size={18}/> Cho ăn</span>
                            <ArrowRight size={16}/>
                        </Link>
                        <Link to="/MoiTruong" className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition backdrop-blur-sm cursor-pointer">
                            <span className="flex items-center gap-2"><Droplets size={18}/> Đo môi trường</span>
                            <ArrowRight size={16}/>
                        </Link>
                        <Link to="/SucKhoe" className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition backdrop-blur-sm cursor-pointer">
                            <span className="flex items-center gap-2"><Activity size={18}/> Báo bệnh/Chết</span>
                            <ArrowRight size={16}/>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-2">Tình trạng Bể</h3>
                    <div className="space-y-2">
                        {data.tanks.slice(0, 5).map(tank => (
                            <div key={tank._id} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 py-2">
                                <span className="font-medium">{tank.name}</span>
                                {tank.status === 'raising' ? (
                                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">Đang nuôi ({tank.currentQuantity})</span>
                                ) : (
                                    <span className="text-gray-400 text-xs">Trống</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}