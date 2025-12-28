import { useEffect, useState } from "react";
// ⚠️ KHI CHẠY DỰ ÁN THẬT: Bỏ chú thích dòng dưới đây
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
    size: "",
    location: "",
  });

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";


  if (!token) {
    return (
      <Layout>
        <div className="text-center py-10 text-red-600 text-xl">
          Bạn chưa đăng nhập!
        </div>
      </Layout>
    );
  }


  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'size' && value !== '' ? Number(value) : value;

    setForm({
        ...form,
        [name]: processedValue,
    });
  };

  const loadTanks = async () => {
    if (!token) {
        // Mock data
        setTanks([
            { _id: '1', name: 'Bể số 1', status: 'raising', currentBatchId: { name: 'Lươn Nhật F1' }, currentQuantity: 2000, size: 500, location: 'Khu A' },
            { _id: '2', name: 'Bể số 2', status: 'empty', currentQuantity: 0, size: 300, location: 'Khu B' },
            { _id: '3', name: 'Bể số 3', status: 'raising', currentBatchId: { name: 'Lươn Đồng' }, currentQuantity: 1500, size: 1000, location: 'Khu C' }
        ]);
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        alert("Token hết hạn hoặc chưa đăng nhập!");
        return;
      }

      const data = await res.json();
      const list = data.tanks || data.data || data;
      setTanks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log("Error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadTanks();
  }, []);

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

  const closePopup = () => {
    setShowPopup(false);
    setSelectedTank(null);
    setForm({ name: "", size: "", location: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSend = {
        ...form,
        size: form.size !== '' ? Number(form.size) : null,
    };
    
    try {
      const method = popupType === "edit" ? "PUT" : "POST";
      const url = popupType === "edit" ? `${API_URL}/${selectedTank._id}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const handleDelete = async () => {
    if (!selectedTank) return;
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
                          <button onClick={() => openPopup("view", tank)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">Xem</button>
                          <button onClick={() => openPopup("edit", tank)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm">Sửa</button>
                          <button onClick={() => openPopup("delete", tank)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Xóa</button>
                        </td>
                      </tr>
                    );
                  })}
                  {tanks.length === 0 && (
                    <tr><td colSpan="8" className="text-center p-4 text-gray-500">Chưa có dữ liệu bể nuôi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* POPUP */}
          {showPopup && (
            <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
              <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">
                
                {/* VIEW (Xem chi tiết) */}
                {popupType === "view" && selectedTank && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">Chi tiết bể</h2>
                    <div className="space-y-3 text-gray-700">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold">Tên bể:</span>
                            <span>{selectedTank.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold">Trạng thái:</span>
                            {selectedTank.status === 'raising' ? (
                                <span className="text-blue-600 font-bold">Đang nuôi</span>
                            ) : (
                                <span className="text-green-600 font-bold">Trống</span>
                            )}
                        </div>
                        
                        {selectedTank.status === 'raising' && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                                <p className="mb-1"><strong>Giống lươn:</strong> {selectedTank.currentBatchId?.name || selectedTank.type || "Không rõ"}</p>
                                <p><strong>Số lượng hiện tại:</strong> <span className="font-bold text-red-600">{selectedTank.currentQuantity || 0} con</span></p>
                            </div>
                        )}
                        
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold">Dung tích:</span>
                            <span>{selectedTank.size} Lít</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold">Vị trí:</span>
                            <span>{selectedTank.location}</span>
                        </div>
                    </div>
                    <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                  </>
                )}

                {/* CREATE / EDIT FORM (Đã thêm Label) */}
                {(popupType === "create" || popupType === "edit") && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-blue-600">
                      {popupType === "create" ? "Thêm bể mới" : "Cập nhật bể"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      
                      {/* Tên bể */}
                      <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-700 mb-1">Tên bể nuôi <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            name="name" 
                            placeholder="Ví dụ: Bể số 1" 
                            value={form.name} 
                            onChange={handleChange} 
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                            required
                          />
                      </div>
                      
                      {/* Dung tích */}
                      <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-700 mb-1">Dung tích (Lít) <span className="text-red-500">*</span></label>
                          <input 
                            type="number" 
                            name="size" 
                            placeholder="Ví dụ: 500" 
                            value={form.size} 
                            onChange={handleChange} 
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                            required
                            min="0"
                          />
                      </div>

                      {/* Vị trí */}
                      <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-700 mb-1">Vị trí đặt bể</label>
                          <input 
                            type="text" 
                            name="location" 
                            placeholder="Ví dụ: Khu A - Ngoài trời" 
                            value={form.location} 
                            onChange={handleChange} 
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
                            required
                          />
                      </div>

                      {/* Nút ngang hàng */}
                      <div className="flex space-x-3 pt-4">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                          {popupType === "create" ? "Lưu lại" : "Cập nhật"}
                        </button>
                        <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition">
                          Hủy bỏ
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* DELETE CONFIRM */}
                {popupType === "delete" && selectedTank && (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa bể?</h2>
                    <p className="mb-4 text-gray-700">
                        Bạn có chắc muốn xóa <strong>{selectedTank.name}</strong> không? <br/>
                        <span className="text-sm text-red-500 italic">Lưu ý: Hành động này không thể hoàn tác!</span>
                    </p>
                    <div className="flex space-x-3">
                        <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xóa ngay</button>
                        <button onClick={closePopup} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition">Hủy bỏ</button>
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

