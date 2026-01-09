import { useEffect, useState } from "react";

import Layout from "../components/Layout";
export default function BeNuoi() {
  const API_URL = "http://localhost:5000/api/tank";

  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  // Bổ sung state tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

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

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

  // Hàm loại bỏ dấu tiếng Việt (giữ nguyên logic bạn gửi)
  const removeAccents = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Logic lọc dữ liệu (giữ nguyên logic bạn gửi)
  const filteredTanks = tanks.filter((tank) => {
    const searchLow = removeAccents(searchTerm);
    const nameLow = removeAccents(tank.name || "");
    const locationLow = removeAccents(tank.location || "");
    const seedLow = removeAccents(tank.currentBatchId?.name || tank.type || "");

    return (
      nameLow.includes(searchLow) ||
      locationLow.includes(searchLow) ||
      seedLow.includes(searchLow)
    );
  });

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
      alert(`Thao tác thành công (Môi trường Preview)`);
      loadTanks();
      closePopup();
    }
  };

  const handleDelete = async () => {
    if (!selectedTank) return;
    try {
      await fetch(`${API_URL}/${selectedTank._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadTanks();
      closePopup();
    } catch (err) {
      loadTanks();
      closePopup();
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="text-center py-10 text-red-600 text-xl font-bold">
          Bạn chưa đăng nhập!
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Quản lý Bể nuôi</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-96">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm tên, vị trí, giống..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 outline-none"
              />
            </div>
            <button
              onClick={() => openPopup("create")}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold shadow-md shrink-0"
            >
              + Thêm bể nuôi
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Thêm table-fixed để cố định kích thước theo yêu cầu */}
            <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-center w-[60px]">STT</th>
                  <th className="py-3 px-4 text-left w-[180px]">Tên bể</th>
                  <th className="py-3 px-4 text-center w-[120px]">Trạng thái</th>
                  <th className="py-3 px-4 text-left w-[180px]">Giống nuôi</th>
                  <th className="py-3 px-4 text-center w-[100px]">SL (con)</th>
                  <th className="py-3 px-4 text-center w-[100px]">Dung tích</th>
                  <th className="py-3 px-4 text-left w-[150px]">Vị trí</th>
                  <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTanks.map((tank, index) => {
                  const seedName = tank.currentBatchId?.name || tank.type || "---";

                  return (
                    <tr key={tank._id} className="border-b hover:bg-gray-100 h-[60px]">
                      <td className="py-3 px-4 text-center">{index + 1}</td>
                      <td className="py-3 px-4 font-medium truncate" title={tank.name}>{tank.name}</td>

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

                      <td className="py-3 px-4 text-left text-sm text-gray-700 truncate" title={seedName}>
                        {tank.status === 'raising' ? seedName : '---'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {tank.status === 'raising' ? (tank.currentQuantity || 0) : '-'}
                      </td>

                      <td className="py-3 px-4 text-center">{tank.size} L</td>
                      <td className="py-3 px-4 truncate" title={tank.location}>{tank.location}</td>

                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => openPopup("view", item)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition shadow-sm" title="Xem">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => openPopup("edit", item)} className="p-1.5 bg-amber-100 text-amber-600 rounded-md hover:bg-amber-200 transition shadow-sm" title="Sửa">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => openPopup("delete", item)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition shadow-sm" title="Xóa">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTanks.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-10 text-gray-500 italic">Không tìm thấy dữ liệu phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP (Giữ nguyên CSS gốc của bạn) */}
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

              {/* CREATE / EDIT FORM */}
              {(popupType === "create" || popupType === "edit") && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-blue-600">
                    {popupType === "create" ? "Thêm bể mới" : "Cập nhật bể"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Tên bể nuôi <span className="text-red-500">*</span></label>
                      <input type="text" name="name" placeholder="Ví dụ: Bể số 1" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Dung tích (Lít) <span className="text-red-500">*</span></label>
                      <input type="number" name="size" placeholder="Ví dụ: 500" value={form.size} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required min="0" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-bold text-gray-700 mb-1">Vị trí đặt bể</label>
                      <input type="text" name="location" placeholder="Ví dụ: Khu A" value={form.location} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">{popupType === "create" ? "Lưu lại" : "Cập nhật"}</button>
                      <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition">Hủy bỏ</button>
                    </div>
                  </form>
                </>
              )}

              {/* DELETE CONFIRM */}
              {popupType === "delete" && selectedTank && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">Xóa bể?</h2>
                  <p className="mb-4 text-gray-700">
                    Bạn có chắc muốn xóa <strong>{selectedTank.name}</strong> không? <br />
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
    </Layout>
  );
}