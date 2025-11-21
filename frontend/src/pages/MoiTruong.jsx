import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function EnvironmentManager() {
  // --- Cấu hình API và Token ---
  const API_ENV = "http://localhost:5000/api/MoiTruong";
  const API_TANK = "http://localhost:5000/api/Tank";
  const token = localStorage.getItem("token");

  // --- State Quản lý dữ liệu và UI ---
  const [environments, setEnvironments] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // create | edit | view | delete
  const [selectedRecord, setSelectedRecord] = useState(null);

  // --- State Quản lý Form ---
  const [form, setForm] = useState({
    tankId: "",
    pH: "",
    temperature: "",
    oxygen: "",
    turbidity: "",
  });
  
  // --- Hàm xử lý thay đổi Input (Chuyển đổi sang Number) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Chuyển đổi giá trị sang kiểu Number, nếu là chuỗi rỗng thì giữ nguyên chuỗi rỗng
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value === "" ? "" : Number(value),
    }));
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

  const fetchEnvironments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENV, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnvironments(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu môi trường:", err);
      alert("Lỗi khi lấy dữ liệu môi trường");
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect để load dữ liệu khi component mount ---
  useEffect(() => {
    fetchTanks();
    fetchEnvironments();
  }, []);

  // --- Chức năng Quản lý Popup ---
  
  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    setForm(
      record
        ? {
            // Đảm bảo tankId là string ID
            tankId: record.tankId?._id || record.tankId || "", 
            // Giữ nguyên các giá trị ban đầu, sau này handleChange sẽ xử lý Number
            pH: record.pH, 
            temperature: record.temperature,
            oxygen: record.oxygen,
            turbidity: record.turbidity,
          }
        : { tankId: "", pH: "", temperature: "", oxygen: "", turbidity: "" }
    );

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType("");
    setSelectedRecord(null);
    // Reset form
    setForm({ tankId: "", pH: "", temperature: "", oxygen: "", turbidity: "" });
  };

  // --- Xử lý Submit (Thêm mới/Cập nhật) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Kiểm tra ràng buộc cơ bản
    if (!form.tankId) {
      alert("Vui lòng chọn bể nuôi");
      return;
    }
    
    // 2. Chuẩn bị dữ liệu để gửi API (Đảm bảo tất cả các trường là Number)
    const dataToSend = {
      tankId: form.tankId,
      pH: Number(form.pH),
      temperature: Number(form.temperature),
      oxygen: Number(form.oxygen),
      turbidity: Number(form.turbidity),
    };

    try {
      if (popupType === "edit") {
        await axios.put(`${API_ENV}/${selectedRecord._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Cập nhật thành công");
      } else {
        await axios.post(API_ENV, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Thêm mới thành công");
      }
      
      // 3. Cập nhật dữ liệu và đóng popup
      fetchEnvironments();
      closePopup();
      
    } catch (err) {
      // 4. In lỗi chi tiết từ backend ra console
      console.error("Lỗi gửi API:", err.response?.data || err.message);
      alert(`Có lỗi xảy ra: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- Xử lý Xóa ---
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_ENV}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa thành công");
      fetchEnvironments();
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
          <h1 className="text-3xl font-bold text-blue-600">Quản lý Môi Trường</h1>
          <button
            onClick={() => openPopup("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Thêm Môi trường
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center">STT</th>
                  <th className="py-3 px-4 text-center">Bể</th>
                  <th className="py-3 px-4 text-center">pH</th>
                  <th className="py-3 px-4 text-center">Nhiệt độ (°C)</th>
                  <th className="py-3 px-4 text-center">Oxy (mg/L)</th>
                  <th className="py-3 px-4 text-center">Độ đục (NTU)</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {environments.map((env, index) => (
                  <tr key={env._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4 text-center">{env.tankId?.name}</td>
                    <td className="py-3 px-4 text-center">{env.pH}</td>
                    <td className="py-3 px-4 text-center">{env.temperature}</td>
                    <td className="py-3 px-4 text-center">{env.oxygen}</td>
                    <td className="py-3 px-4 text-center">{env.turbidity}</td>
                    <td className="py-3 px-4 justify-center flex gap-2">
                      <button
                        onClick={() => openPopup("view", env)}
                        className="px-3 py-1  bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => openPopup("edit", env)}
                        className="px-3 py-1  bg-yellow-400 text-white rounded hover:bg-yellow-500"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => openPopup("delete", env)}
                        className="px-3 py-1  bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {environments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center p-4">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">

              {/* VIEW */}
              {popupType === "view" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">
                    Chi tiết môi trường
                  </h2>
                  <p><strong>Bể:</strong> {selectedRecord.tankId?.name}</p>
                  <p><strong>pH:</strong> {selectedRecord.pH}</p>
                  <p><strong>Nhiệt độ:</strong> {selectedRecord.temperature} °C</p>
                  <p><strong>Oxy:</strong> {selectedRecord.oxygen} mg/L</p>
                  <p><strong>Độ đục:</strong> {selectedRecord.turbidity} NTU</p>
                  <button
                    onClick={closePopup}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
                  >
                    Đóng
                  </button>
                </>
              )}

              {/* CREATE / EDIT */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">
                    {popupType === "create" ? "Thêm mới môi trường" : "Cập nhật môi trường"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <select
                      className="w-full border px-3 py-2 rounded"
                      name="tankId" // Thêm name để dễ quản lý form
                      value={form.tankId}
                      // tankId là ID chuỗi, KHÔNG cần dùng hàm handleChange
                      onChange={(e) => setForm({ ...form, tankId: e.target.value })} 
                      required
                    >
                      <option value="">-- Chọn bể nuôi --</option>
                      {tanks.length > 0
                        ? tanks.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name} ({t.type})
                            </option>
                          ))
                        : <option disabled>Đang tải bể...</option>}
                    </select>

                    <input
                      type="number"
                      name="pH"
                      placeholder="pH"
                      className="w-full border px-3 py-2 rounded"
                      value={form.pH}
                      onChange={handleChange} // Dùng hàm tự động chuyển đổi sang Number
                      required
                    />
                    <input
                      type="number"
                      name="temperature"
                      placeholder="Nhiệt độ °C"
                      className="w-full border px-3 py-2 rounded"
                      value={form.temperature}
                      onChange={handleChange} // Dùng hàm tự động chuyển đổi sang Number
                      required
                    />
                    <input
                      type="number"
                      name="oxygen"
                      placeholder="Oxy mg/L"
                      className="w-full border px-3 py-2 rounded"
                      value={form.oxygen}
                      onChange={handleChange} // Dùng hàm tự động chuyển đổi sang Number
                      required
                    />
                    <input
                      type="number"
                      name="turbidity"
                      placeholder="Độ đục NTU"
                      className="w-full border px-3 py-2 rounded"
                      value={form.turbidity}
                      onChange={handleChange} // Dùng hàm tự động chuyển đổi sang Number
                      required
                    />

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      {popupType === "create" ? "Thêm mới" : "Cập nhật"}
                    </button>
                  </form>
                  <button
                    onClick={closePopup}
                    className="mt-3 w-full bg-gray-300 py-2 rounded hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                </>
              )}

              {/* DELETE */}
              {popupType === "delete" && (
                <>
                  <h2 className="text-2xl font-bold text-red-600 mb-4">
                    Xóa bản ghi?
                  </h2>
                  <p>Bạn có chắc muốn xóa bản ghi này?</p>
                  <button
                    onClick={handleDelete}
                    className="mt-4 w-full bg-red-600 text-white py-2 rounded"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={closePopup}
                    className="mt-3 w-full bg-gray-300 py-2 rounded hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}