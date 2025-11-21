import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function FeedingLogManager() {
  // --- Cấu hình API và Token ---
  const API_FEEDING_LOG = "http://localhost:5000/api/nhatkyan";
  const API_TANK = "http://localhost:5000/api/tank"; // Giả định API tank
  const token = localStorage.getItem("token");

  // --- State Quản lý dữ liệu và UI ---
  const [logs, setLogs] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // create | edit | view | delete
  const [selectedRecord, setSelectedRecord] = useState(null);

  // --- State Quản lý Form (Ánh xạ từ Schema) ---
  const [form, setForm] = useState({
    tankId: "",
    feedType: "",
    quantity: "",
    notes: "",
  });

  // --- Hàm xử lý thay đổi Input (Chuyển đổi quantity sang Number) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "quantity") {
      // Đảm bảo quantity là Number hoặc chuỗi rỗng
      processedValue = value === "" ? "" : Number(value);
    }
    
    setForm((prevForm) => ({
      ...prevForm,
      [name]: processedValue,
    }));
  };

  // --- Chức năng Load Data ---

  // Load danh sách bể (cho dropdown)
  const fetchTanks = async () => {
    try {
      const res = await axios.get(API_TANK, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTanks(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bể:", err);
      // Giữ alert để thông báo cho người dùng
      alert("Lỗi khi lấy danh sách bể"); 
    }
  };

  // Load danh sách nhật ký cho ăn
  const fetchFeedingLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_FEEDING_LOG, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu nhật ký:", err);
      alert("Lỗi khi lấy dữ liệu nhật ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTanks();
    fetchFeedingLogs();
  }, []);

  // --- Chức năng Quản lý Popup ---

  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    setForm(
      record
        ? {
            tankId: record.tankId?._id || record.tankId || "",
            feedType: record.feedType,
            quantity: record.quantity,
            notes: record.notes,
          }
        : { tankId: "", feedType: "", quantity: "", notes: "" }
    );

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType("");
    setSelectedRecord(null);
    setForm({ tankId: "", feedType: "", quantity: "", notes: "" });
  };

  // --- Xử lý Submit (Thêm mới/Cập nhật) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.tankId) {
      alert("Vui lòng chọn bể nuôi");
      return;
    }

    // Chuẩn bị dữ liệu gửi đi (Đảm bảo quantity là Number)
    const dataToSend = {
      ...form,
      quantity: Number(form.quantity),
      // Mặc định feedingTime sẽ do server tự set (Date.now)
    };
    
    // Xóa notes nếu nó là chuỗi rỗng
    if (!dataToSend.notes) delete dataToSend.notes;

    try {
      if (popupType === "edit") {
        await axios.put(`${API_FEEDING_LOG}/${selectedRecord._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Cập nhật nhật ký thành công");
      } else {
        await axios.post(API_FEEDING_LOG, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Thêm mới nhật ký thành công");
      }

      fetchFeedingLogs();
      closePopup();
    } catch (err) {
      console.error("LỖI GỬI API:", err.response?.data || err.message);
      alert(`Có lỗi xảy ra: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- Xử lý Xóa ---
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_FEEDING_LOG}/${selectedRecord._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa nhật ký thành công");
      fetchFeedingLogs();
      closePopup();
    } catch (err) {
      console.error("Lỗi xóa bản ghi:", err);
      alert("Xóa thất bại");
    }
  };

  // Hàm định dạng ngày giờ
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const options = {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // --- Phần Render Component ---
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Quản lý Nhật Ký Cho Ăn</h1>
          <button
            onClick={() => openPopup("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Thêm Nhật ký
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
                  <th className="py-3 px-4">Bể</th>
                  <th className="py-3 px-4">Loại thức ăn</th>
                  <th className="py-3 px-4 text-center">Số lượng</th>
                  <th className="py-3 px-4 text-center">Thời gian</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log._id} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4 text-center">{index + 1}</td>
                    <td className="py-3 px-4">{log.tankId?.name}</td>
                    <td className="py-3 px-4">{log.feedType}</td>
                    <td className="py-3 px-4 text-center">{log.quantity}</td>
                    <td className="py-3 px-4 text-center">{formatDateTime(log.feedingTime)}</td>
                    <td className="py-3 px-4">{log.notes || '---'}</td>
                    <td className="py-3 px-4 flex justify-center gap-2">
                      <button
                        onClick={() => openPopup("view", log)}
                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => openPopup("edit", log)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => openPopup("delete", log)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center p-4">
                      Không có nhật ký cho ăn
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
                    Chi tiết Nhật ký
                  </h2>
                  <p><strong>Bể:</strong> {selectedRecord.tankId?.name}</p>
                  <p><strong>Loại thức ăn:</strong> {selectedRecord.feedType}</p>
                  <p><strong>Số lượng:</strong> {selectedRecord.quantity}</p>
                  <p><strong>Thời gian:</strong> {formatDateTime(selectedRecord.feedingTime)}</p>
                  <p><strong>Ghi chú:</strong> {selectedRecord.notes || 'Không có'}</p>
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
                    {popupType === "create" ? "Thêm mới Nhật ký" : "Cập nhật Nhật ký"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <select
                      className="w-full border px-3 py-2 rounded"
                      name="tankId"
                      value={form.tankId}
                      onChange={handleChange}
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
                      type="text"
                      name="feedType"
                      placeholder="Loại thức ăn"
                      className="w-full border px-3 py-2 rounded"
                      value={form.feedType}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="number"
                      name="quantity"
                      placeholder="Số lượng"
                      className="w-full border px-3 py-2 rounded"
                      value={form.quantity}
                      onChange={handleChange}
                      required
                    />
                    <textarea
                      name="notes"
                      placeholder="Ghi chú (Tùy chọn)"
                      rows="3"
                      className="w-full border px-3 py-2 rounded"
                      value={form.notes}
                      onChange={handleChange}
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
              {popupType === "delete" && selectedRecord && (
                <>
                  <h2 className="text-2xl font-bold text-red-600 mb-4">
                    Xóa Nhật ký?
                  </h2>
                  <p>Bạn có chắc muốn xóa Nhật ký cho ăn này của **{selectedRecord.tankId?.name}** vào lúc **{formatDateTime(selectedRecord.feedingTime)}**?</p>
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