import { useState, useContext, useEffect, createContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// ⚠️ KHI CHẠY DỰ ÁN THẬT: Bỏ chú thích 2 dòng dưới và xóa các phần giả lập bên dưới
import Layout from "../components/Layout.jsx";
import { AuthContext } from "../components/trangThaiDangNhap.jsx"; 



export default function Login() {
  const navigate = useNavigate();

  // 1. Lấy biến isLoggedIn từ Context
  const { login, isLoggedIn } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  // 2. TỰ ĐỘNG CHUYỂN HƯỚNG NẾU ĐÃ ĐĂNG NHẬP
  useEffect(() => {
    if (isLoggedIn) {
      // Dùng replace: true để người dùng không bấm Back quay lại trang login được
      navigate("/BeNuoi", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMsg("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password,
      });

      // LƯU TOKEN VÀ USER
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Cập nhật trạng thái vào Context
      login(res.data.token);

      setMsg("");
      // Không cần gọi navigate ở đây nữa vì useEffect ở trên sẽ tự chạy khi isLoggedIn đổi thành true

    } catch (error) {
      setMsg(
        error.response?.data?.message || "Đăng nhập thất bại, thử lại!"
      );
    }
  };

  // 3. NGĂN CHẶN HIỂN THỊ GIAO DIỆN LOGIN KHI ĐÃ ĐĂNG NHẬP
  // Nếu đã đăng nhập, trả về null (màn hình trắng) trong tích tắc trước khi chuyển hướng
  if (isLoggedIn) {
    return null;
  }

  return (
    <Layout>
      <div className="flex justify-center items-center py-20">
        <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
            Đăng nhập
          </h2>

          {msg && (
            <p className="bg-red-100 text-red-600 p-2 rounded mb-4 text-center">
              {msg}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-400"
                placeholder="Nhập email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Mật khẩu</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-400"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Đăng nhập
            </button>
          </form>

          <p className="mt-4 text-center text-gray-700">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

