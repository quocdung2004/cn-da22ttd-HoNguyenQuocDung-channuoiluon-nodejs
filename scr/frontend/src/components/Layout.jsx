import { Link, useLocation } from "react-router-dom";
import { useContext, useState, createContext, useRef, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Warehouse,
  Activity,
  Droplets,
  Utensils,
  Wallet,
  LogOut,
  Menu,
  X,
  Truck,
  DollarSign,
  Pill,
  Home,
  MessageSquare,
  Send,
  Bot,
  AlertTriangle
} from "lucide-react";

import { AuthContext } from "./trangThaiDangNhap";
import AIConsultant from "./AIConsultant";

// --- ICON GIỌT NƯỚC (Water Drop) ---
const WaterDropIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Hình giọt nước: nhọn ở trên, tròn to ở dưới */}
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

export default function Layout({ children }) {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogoutConfirmation = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?")) {
      logout();
    }
  };

  // Danh sách menu đã được phân nhóm
  const menuGroups = [
    {items: [{ path: "/", label: "Tổng quan (Dashboard)", icon: <Home size={20} /> } ]},
    {        
      title: "Hạ tầng & Đầu vào",
      items: [
        { path: "/BeNuoi", label: "Quản lý Bể nuôi", icon: <LayoutDashboard size={20} /> },
        { path: "/GiongLuon", label: "Giống lươn", icon: <WaterDropIcon size={20} /> }, // Thay EelIcon bằng WaterDropIcon
        { path: "/ThucAn", label: "Kho Thức ăn", icon: <Warehouse size={20} /> },
        { path: "/Thuoc", label: "Kho Thuốc", icon: <Pill size={20} /> },
      ]
    },
    {
      title: "Quy trình Nuôi",
      items: [
        { path: "/NhatKyChoAn", label: "Nhật ký cho ăn", icon: <Utensils size={20} /> },
        { path: "/MoiTruong", label: "Môi trường nước", icon: <Droplets size={20} /> },
        { path: "/SucKhoe", label: "Sức khỏe & Dịch bệnh", icon: <Activity size={20} /> },
      ]
    },
    {
      title: "Tài chính & Đầu ra",
      items: [
        { path: "/XuatBan", label: "Xuất bán", icon: <Truck size={20} /> },
        { path: "/ChiPhiVanHanh", label: "Chi phí vận hành", icon: <Wallet size={20} /> },
        { path: "/TaiChinh", label: "Báo cáo Tài chính", icon: <DollarSign size={20} /> },
      ]
    }
  ];

  const NavItem = ({ to, label, icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${isActive
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        <header className="bg-white shadow py-4">
          <div className="container mx-auto px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <WaterDropIcon /> AquaEel Manager {/* Thay EelIcon bằng WaterDropIcon */}
            </h1>
            <nav className="space-x-4 text-sm font-medium text-gray-600">
              <Link to="/" className="hover:text-blue-600 transition">Đăng nhập</Link>
              <Link to="/register" className="hover:text-blue-600 transition">Đăng ký</Link>
            </nav>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {/* 1. SIDEBAR */}
      <aside
        className={`bg-white border-r border-gray-200 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-64"
          } fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <WaterDropIcon className="text-blue-500" /> AquaEel {/* Thay EelIcon bằng WaterDropIcon */}
          </h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden ml-auto text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
          {menuGroups.map((group, index) => (
            <div key={index}>
              <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.path} to={item.path} label={item.label} icon={item.icon} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleLogoutConfirmation}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-600">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {menuGroups.flatMap(g => g.items).find(i => i.path === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">Xin chào, Quản lý</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 relative scrollbar-thin scrollbar-thumb-gray-300">
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>

          {/* AI Consultant luôn nổi ở góc */}
          <AIConsultant />
        </main>
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500 mt-auto">
          © {new Date().getFullYear()} AquaEel Manager — All rights reserved.
        </footer>
      </div>

    </div>
  );
}