import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Register() {
  const navigate = useNavigate();
  const API = "http://localhost:5000/api/users";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) return setMsg(data.message);

      navigate("/");
    } catch (err) {
      setMsg("Server lỗi, thử lại sau");
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center py-20">
        <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
            Đăng ký tài khoản
          </h2>

          {msg && <p className="bg-red-100 text-red-600 p-2 rounded mb-4 text-center">{msg}</p>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Họ tên</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-400"
                placeholder="Nhập họ tên..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                placeholder="Tối thiểu 6 ký tự..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Đăng ký
            </button>
          </form>

          <p className="mt-4 text-center text-gray-700">
            Đã có tài khoản?{" "}
            <Link to="/" className="text-blue-600 hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
