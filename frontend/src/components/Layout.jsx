import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../components/trangThaiDangNhap"; // Giả sử path

export default function Layout({ children }) {
  // Lấy trạng thái đăng nhập và hàm logout từ Context
  const { isLoggedIn, logout } = useContext(AuthContext);
  const handleLogoutConfirmation = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?")) {
      logout();
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <header className="bg-blue-600 text-white py-4 shadow">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AquaEel Manager</h1>

          <nav>
            {/* --- CÁC LINKS DÀNH CHO NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP --- */}
            {isLoggedIn ? (
              <>
                <Link to="/BeNuoi" className="mr-4 hover:underline">Bể nuôi</Link>
                <Link to="/MoiTruong" className="mr-4 hover:underline">Môi Trường</Link>
                <Link to="/NhatKyAn" className="mr-4 hover:underline">Nhật ký ăn</Link>
                <Link to="/SucKhoe" className="mr-4 hover:underline">Sức khỏe</Link>
                <Link to="/TaiChinh" className="mr-4 hover:underline">Tài chính</Link>

                {/* Nút Đăng xuất */}
                <button
                  onClick={handleLogoutConfirmation} // <-- Đã thay đổi hàm gọi
                  className="mr-4 hover:underline bg-red-500 px-3 py-1 rounded text-white"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              // --- CÁC LINKS DÀNH CHO NGƯỜI DÙNG CHƯA ĐĂNG NHẬP ---
              <>
                <Link to="/" className="mr-4 hover:underline">Login</Link>
                <Link to="/register" className="mr-4 hover:underline">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-grow">{children}</main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-gray-300 py-4 text-center">
        © {new Date().getFullYear()} AquaEel Manager — All rights reserved.
      </footer>
    </div>
  );
}