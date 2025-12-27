import { useState, useContext, useEffect, createContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";


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
      navigate("/Dashboard", { replace: true });
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
      <div className="flex justify-center items-center py-20 min-h-[80vh]"> {/* Tăng min-height để form căn giữa màn hình hơn */}
        <div className="bg-white w-full max-w-lg p-10 rounded-2xl shadow-xl"> {/* Tăng max-width và padding */}
          <h2 className="text-3xl font-bold text-center mb-8 text-blue-600"> {/* Tăng cỡ chữ tiêu đề và margin bottom */}
            Đăng nhập
          </h2>

          {msg && (
            <p className="bg-red-100 text-red-600 p-3 rounded-lg mb-6 text-center text-sm font-medium border border-red-200">
              {msg}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-6"> {/* Tăng khoảng cách giữa các input */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label> {/* Làm đậm label */}
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" // Input to hơn, bo tròn hơn
                placeholder="Nhập địa chỉ email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Mật khẩu</label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg mt-2" // Nút to hơn, có shadow
            >
              Đăng nhập ngay
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

