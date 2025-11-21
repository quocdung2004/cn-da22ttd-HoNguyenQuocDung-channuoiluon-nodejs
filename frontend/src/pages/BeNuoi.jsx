import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function BeNuoi() {
  const API_URL = "http://localhost:5000/api/tank";

  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); 
  const [selectedTank, setSelectedTank] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    type: "",
    size: "",
    location: "",
  });

  const token = localStorage.getItem("token");

  // Nếu chưa đăng nhập thì không load API
  if (!token) {
    return (
      <Layout>
        <div className="text-center py-10 text-red-600 text-xl">
          Bạn chưa đăng nhập!
        </div>
      </Layout>
    );
  }

  // Hàm xử lý thay đổi Input (Đảm bảo size là Number)
  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'size' && value !== '' ? Number(value) : value;

    setForm({
        ...form,
        [name]: processedValue,
    });
  };

  const loadTanks = async () => {
    try {
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { alert("Token hết hạn hoặc chưa đăng nhập!"); return; }

      const data = await res.json();
      const list = data.tanks || data.data || data;
      setTanks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log("Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => { loadTanks(); }, []);

  // Open popup
  const openPopup = (type, tank = null) => {
    setPopupType(type);
    setSelectedTank(tank);
    setShowPopup(true);

    if (tank) setForm({ 
        name: tank.name || "", 
        type: tank.type || "", 
        size: tank.size || "", 
        location: tank.location || ""
    });
    else setForm({ name: "", type: "", size: "", location: "" });
  };

  // Close popup
  const closePopup = () => {
    setShowPopup(false);
    setSelectedTank(null);
    setForm({ name: "", type: "", size: "", location: "" });
  };

  // Submit form (create/edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = { ...form, size: form.size !== '' ? Number(form.size) : null };
    
    try {
      const method = popupType === "edit" ? "PUT" : "POST";
      const url = popupType === "edit" ? `${API_URL}/${selectedTank._id}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi API: ${response.status}`);
      }

      loadTanks();
      closePopup();
    } catch (err) {
      console.log(err);
      alert(`Thao tác thất bại: ${err.message || 'Lỗi không xác định'}`);
    }
  };

  // Delete tank
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/${selectedTank._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi API: ${response.status}`);
      }

      loadTanks();
      closePopup();
    } catch (err) {
      console.log(err);
      alert(`Xóa thất bại: ${err.message || 'Lỗi không xác định'}`);
    }
  };

  return (
    <Layout>
      {/* Container chính: Đã thay đổi thành p-6 đơn giản như EnvironmentManager */}
      <div className="p-6"> 

        {/* HEADER VÀ NÚT THÊM BỂ: Đã đồng bộ CSS và cấu trúc */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Quản lý Bể Nuôi</h1>
          <button
            onClick={() => openPopup("create")}
            // Đã đồng bộ CSS: rounded-lg (thay vì rounded-xl), hover:bg-blue-700
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition" 
          >
            + Thêm Bể
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Đã xóa min-w-full để bảng full width */}
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden"> 
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center">STT</th>
                  <th className="py-3 px-4">Tên bể</th>
                  <th className="py-3 px-4 text-center">Loại</th>
                  <th className="py-3 px-4 text-center">Dung tích (L)</th>
                  <th className="py-3 px-4">Vị trí</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tanks.map((tank, index) => (
                  <tr key={tank._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4">{tank.name}</td>
                    <td className="py-3 px-4 text-center">{tank.type}</td>
                    <td className="py-3 px-4 text-center">{tank.size}</td>
                    <td className="py-3 px-4">{tank.location}</td>
                    <td className="py-3 px-4 flex gap-2 justify-center">
                      <button
                        onClick={() => openPopup("view", tank)}
                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => openPopup("edit", tank)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => openPopup("delete", tank)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {tanks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center p-4">
                      Không có dữ liệu bể nuôi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP (Đã đồng bộ) */}
        {showPopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative"> 
              {/* VIEW */}
              {popupType === "view" && selectedTank && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi tiết bể</h2>
                  <p><strong>Tên bể:</strong> {selectedTank.name}</p>
                  <p><strong>Loại:</strong> {selectedTank.type}</p>
                  <p><strong>Dung tích:</strong> {selectedTank.size} L</p>
                  <p><strong>Vị trí:</strong> {selectedTank.location}</p>
                  <button
                    onClick={closePopup}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition" // Đã đổi rounded-xl thành rounded-lg
                  >
                    Đóng
                  </button>
                </>
              )}

              {/* CREATE / EDIT */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">
                    {popupType === "create" ? "Thêm bể mới" : "Cập nhật bể"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="text" name="name" placeholder="Tên bể" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required/>
                    <input type="text" name="type" placeholder="Loại" value={form.type} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required/>
                    <input type="number" name="size" placeholder="Dung tích (L)" value={form.size} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required/>
                    <input type="text" name="location" placeholder="Vị trí" value={form.location} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required/>

                    {/* Nút ngang hàng */}
                    <div className="flex space-x-3 pt-2">
                      <button 
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition" // Đã đổi rounded-xl thành rounded-lg
                      >
                        {popupType === "create" ? "Thêm mới" : "Cập nhật"}
                      </button>
                      <button
                        type="button" 
                        onClick={closePopup}
                        className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition" // Đã đổi rounded-xl thành rounded-lg
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* DELETE */}
              {popupType === "delete" && selectedTank && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa bể?</h2>
                  <p>Bạn có chắc muốn xóa <strong>{selectedTank.name}</strong>?</p>
                  <button
                    onClick={handleDelete}
                    className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition" // Đã đổi rounded-xl thành rounded-lg
                  >
                    Xóa
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full mt-3 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition" // Đã đổi rounded-xl thành rounded-lg
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