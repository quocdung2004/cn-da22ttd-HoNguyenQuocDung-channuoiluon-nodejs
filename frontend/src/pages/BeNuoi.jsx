import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// ⚠️ BƯỚC 1: Bỏ chú thích dòng này khi chạy trong dự án thật
import Layout from "../components/Layout";

// 1. Đưa hằng số ra ngoài component để tránh tạo lại mỗi lần render
const API_URL = "http://localhost:5000/api/tank";

export default function BeNuoi() {
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); 
  const [selectedTank, setSelectedTank] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    size: "",
    location: "",
  });

  // Lấy token
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // Hàm xử lý thay đổi Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'size' && value !== '' ? Number(value) : value;

    setForm({
        ...form,
        [name]: processedValue,
    });
  };

  // 2. SỬA LỖI: Dùng useCallback để ghi nhớ hàm loadTanks
  const loadTanks = useCallback(async () => {
    if (!token) {
        // Mock data để không bị lỗi trắng trang khi xem trước
        setTanks([]); 
        setLoading(false);
        return;
    }

    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTanks(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách bể:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 3. SỬA LỖI: Thêm loadTanks vào dependency array
  useEffect(() => {
    loadTanks();
  }, [loadTanks]); 

  // Open popup
  const openPopup = (type, tank = null) => {
    setPopupType(type);
    setSelectedTank(tank);
    setShowPopup(true);

    if (tank) {
      setForm({ 
        name: tank.name || "", 
        size: tank.size || "", 
        location: tank.location || ""
      });
    } else {
      setForm({ name: "", size: "", location: "" });
    }
  };

  // Close popup
  const closePopup = () => {
    setShowPopup(false);
    setSelectedTank(null);
    setForm({ name: "", size: "", location: "" });
  };

  // Submit form (create/edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSend = {
        ...form,
        size: form.size !== '' ? Number(form.size) : null,
    };
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (popupType === "edit") {
        await axios.put(`${API_URL}/${selectedTank?._id}`, dataToSend, config);
        alert("Cập nhật thành công");
      } else {
        await axios.post(API_URL, dataToSend, config);
        alert("Thêm mới thành công");
      }

      loadTanks();
      closePopup();
    } catch (err) {
      console.error("Lỗi submit:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Delete tank
  const handleDelete = async () => {
    if (!selectedTank) return;
    try {
      await axios.delete(`${API_URL}/${selectedTank._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa thành công");
      loadTanks();
      closePopup();
    } catch (err) {
      console.error("Lỗi xóa:", err);
      alert("Xóa thất bại");
    }
  };

  // Nếu chưa đăng nhập
  if (!token) {
    return (
      <Layout>
        <div className="text-center py-10 text-red-600 text-xl">
          Bạn chưa đăng nhập!
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6"> 
        <div className="w-full bg-white rounded-xl shadow-lg p-6">
          
          {/* HEADER & NÚT THÊM BỂ */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600">Quản lý Bể Nuôi</h1>
            <button
              onClick={() => openPopup("create")}
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
              <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="py-3 px-4 text-center w-[5%]">STT</th>
                    <th className="py-3 px-4 text-left w-[15%]">Tên bể</th>
                    <th className="py-3 px-4 text-center w-[15%]">Trạng thái</th>
                    <th className="py-3 px-4 text-left w-[15%]">Giống nuôi</th>
                    <th className="py-3 px-4 text-center w-[10%]">SL (con)</th>
                    <th className="py-3 px-4 text-center w-[10%]">Dung tích</th>
                    <th className="py-3 px-4 text-left w-[15%]">Vị trí</th>
                    <th className="py-3 px-4 text-center w-[15%]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tanks.map((tank, index) => {
                    const seedName = tank.currentBatchId?.name || tank.type || "---";
                    
                    return (
                      <tr key={tank._id} className="border-b hover:bg-gray-100">
                        <td className="py-3 px-4 text-center">{index + 1}</td>
                        <td className="py-3 px-4 font-medium">{tank.name}</td>
                        
                        <td className="py-3 px-4 text-center">
                          {tank.status === 'raising' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Đang nuôi
                              </span>
                          ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Trống
                              </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-left text-sm text-gray-700">
                            {tank.status === 'raising' ? seedName : '---'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700">
                            {tank.status === 'raising' ? (tank.currentQuantity || 0) : '-'}
                        </td>

                        <td className="py-3 px-4 text-center">{tank.size} L</td>
                        <td className="py-3 px-4">{tank.location}</td>
                        
                        <td className="py-3 px-4 flex gap-2 justify-center">
                          <button
                            onClick={() => openPopup("view", tank)}
                            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => openPopup("edit", tank)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => openPopup("delete", tank)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {tanks.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center p-4 text-gray-500">
                        Chưa có dữ liệu bể nuôi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* POPUP */}
          {showPopup && (
            <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
              <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">
                
                {/* VIEW */}
                {popupType === "view" && selectedTank && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi tiết bể</h2>
                    <div className="space-y-3 text-gray-700">
                        <p><strong>Tên bể:</strong> {selectedTank.name}</p>
                        <p>
                            <strong>Trạng thái:</strong>{' '}
                            {selectedTank.status === 'raising' ? (
                                <span className="text-blue-600 font-bold">Đang nuôi</span>
                            ) : (
                                <span className="text-green-600 font-bold">Trống</span>
                            )}
                        </p>
                        
                        {selectedTank.status === 'raising' && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p><strong>Giống lươn:</strong> {selectedTank.currentBatchId?.name || selectedTank.type || "Không rõ"}</p>
                                <p><strong>Số lượng hiện tại:</strong> {selectedTank.currentQuantity || 0} con</p>
                            </div>
                        )}
                        
                        <p><strong>Dung tích:</strong> {selectedTank.size} L</p>
                        <p><strong>Vị trí:</strong> {selectedTank.location}</p>
                    </div>
                    <button
                      onClick={closePopup}
                      className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
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
                      <input type="number" name="size" placeholder="Dung tích (L)" value={form.size} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required/>
                      <input type="text" name="location" placeholder="Vị trí" value={form.location} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required/>

                      <div className="flex space-x-3 pt-2">
                        <button 
                          type="submit"
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          {popupType === "create" ? "Thêm mới" : "Cập nhật"}
                        </button>
                        <button
                          type="button" 
                          onClick={closePopup}
                          className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition"
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
                    <p className="mb-4 text-gray-700">Bạn có chắc muốn xóa <strong>{selectedTank.name}</strong>?</p>
                    <div className="flex space-x-3">
                        <button
                        onClick={handleDelete}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                        >
                        Xóa
                        </button>
                        <button
                        onClick={closePopup}
                        className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                        Hủy
                        </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
