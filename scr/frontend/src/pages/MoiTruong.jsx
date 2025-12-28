import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import Layout from "../components/Layout";

export default function EnvironmentManager() {
  // --- Cấu hình API và Token ---
  const API_ENV = "http://localhost:5000/api/MoiTruong";
  const API_TANK = "http://localhost:5000/api/tank";
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

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
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  // --- Chức năng Load Data (Dùng useCallback để tối ưu) ---
  const fetchData = useCallback(async () => {
    if (!token) {
        // Mock data cho preview
        setTanks([{ _id: 't1', name: 'Bể 1' }, { _id: 't2', name: 'Bể 2' }]);
        setEnvironments([
            { _id: '1', tankId: { name: 'Bể 1' }, pH: 7.5, temperature: 28, oxygen: 5.5, turbidity: 10 },
            { _id: '2', tankId: { name: 'Bể 2' }, pH: 6.8, temperature: 29, oxygen: 4.8, turbidity: 15 }
        ]);
        return;
    }

    try {
      setLoading(true);
      const [resEnv, resTank] = await Promise.all([
        axios.get(API_ENV, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_TANK, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setEnvironments(resEnv.data);
      setTanks(resTank.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Chức năng Quản lý Popup ---
  const openPopup = (type, record = null) => {
    setPopupType(type);
    setSelectedRecord(record);

    setForm(
      record
        ? {
            tankId: record.tankId?._id || record.tankId || "", 
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
    setForm({ tankId: "", pH: "", temperature: "", oxygen: "", turbidity: "" });
  };

  // --- Xử lý Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tankId) { alert("Vui lòng chọn bể nuôi"); return; }
    
    const dataToSend = {
      tankId: form.tankId,
      pH: Number(form.pH),
      temperature: Number(form.temperature),
      oxygen: Number(form.oxygen),
      turbidity: Number(form.turbidity),
    };

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (popupType === "edit") {
        await axios.put(`${API_ENV}/${selectedRecord._id}`, dataToSend, config);
        alert("Cập nhật thành công");
      } else {
        await axios.post(API_ENV, dataToSend, config);
        alert("Thêm mới thành công");
      }
      
      fetchData();
      closePopup();
    } catch (err) {
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
      fetchData();
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
        <div className="w-full bg-white rounded-xl shadow-lg p-6">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600">Quản lý Môi Trường</h1>
            <button
                onClick={() => openPopup("create")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
                + Thêm Môi trường
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
                    <th className="py-3 px-4 text-left w-[20%]">Bể</th>
                    <th className="py-3 px-4 text-center w-[10%]">pH</th>
                    <th className="py-3 px-4 text-center w-[15%]">Nhiệt độ (°C)</th>
                    <th className="py-3 px-4 text-center w-[15%]">Oxy (mg/L)</th>
                    <th className="py-3 px-4 text-center w-[15%]">Độ đục (NTU)</th>
                    <th className="py-3 px-4 text-center w-[20%]">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {environments.map((env, index) => (
                    <tr key={env._id} className="border-b hover:bg-gray-100">
                        <td className="py-3 px-4 text-center">{index + 1}</td>
                        <td className="py-3 px-4 font-medium">{env.tankId?.name}</td>
                        
                        {/* Tô màu cảnh báo nếu chỉ số vượt ngưỡng (Ví dụ đơn giản) */}
                        <td className={`py-3 px-4 text-center font-bold ${env.pH < 6.5 || env.pH > 8.5 ? 'text-red-600' : 'text-green-600'}`}>
                            {env.pH}
                        </td>
                        <td className="py-3 px-4 text-center">{env.temperature}</td>
                        <td className="py-3 px-4 text-center">{env.oxygen}</td>
                        <td className="py-3 px-4 text-center">{env.turbidity}</td>
                        
                        <td className="py-3 px-4 flex justify-center gap-2">
                        <button
                            onClick={() => openPopup("view", env)}
                            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                        >
                            Xem
                        </button>
                        <button
                            onClick={() => openPopup("edit", env)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                        >
                            Sửa
                        </button>
                        <button
                            onClick={() => openPopup("delete", env)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                            Xóa
                        </button>
                        </td>
                    </tr>
                    ))}
                    {environments.length === 0 && (
                    <tr>
                        <td colSpan="7" className="text-center p-4 text-gray-500">
                        Chưa có dữ liệu môi trường.
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
                {popupType === "view" && selectedRecord && (
                    <>
                    <h2 className="text-2xl font-bold text-blue-600 mb-4">
                        Chi tiết môi trường
                    </h2>
                    <div className="space-y-3 text-gray-700">
                        <p><strong>Bể:</strong> {selectedRecord.tankId?.name}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded border text-center">
                                <p className="text-sm text-gray-500">Độ pH</p>
                                <p className="text-xl font-bold text-blue-600">{selectedRecord.pH}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border text-center">
                                <p className="text-sm text-gray-500">Nhiệt độ</p>
                                <p className="text-xl font-bold text-red-600">{selectedRecord.temperature}°C</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border text-center">
                                <p className="text-sm text-gray-500">Oxy hòa tan</p>
                                <p className="text-xl font-bold text-green-600">{selectedRecord.oxygen} mg/L</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border text-center">
                                <p className="text-sm text-gray-500">Độ đục</p>
                                <p className="text-xl font-bold text-gray-600">{selectedRecord.turbidity} NTU</p>
                            </div>
                        </div>
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
                    <h2 className="text-2xl font-bold text-blue-600 mb-4">
                        {popupType === "create" ? "Thêm mới chỉ số" : "Cập nhật chỉ số"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Chọn Bể */}
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 mb-1">Chọn Bể Nuôi <span className="text-red-500">*</span></label>
                            <select
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            name="tankId"
                            value={form.tankId}
                            onChange={(e) => setForm({ ...form, tankId: e.target.value })} 
                            required
                            >
                            <option value="">-- Chọn bể --</option>
                            {tanks.map((t) => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                            </select>
                        </div>

                        {/* Nhập pH và Nhiệt độ */}
                        <div className="flex gap-4">
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm font-bold text-gray-700 mb-1">Độ pH</label>
                                <input
                                type="number"
                                name="pH"
                                placeholder="VD: 7.5"
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={form.pH}
                                onChange={handleChange}
                                required
                                step="0.1"
                                />
                            </div>
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm font-bold text-gray-700 mb-1">Nhiệt độ (°C)</label>
                                <input
                                type="number"
                                name="temperature"
                                placeholder="VD: 28"
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={form.temperature}
                                onChange={handleChange}
                                required
                                step="0.1"
                                />
                            </div>
                        </div>

                        {/* Nhập Oxy và Độ đục */}
                        <div className="flex gap-4">
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm font-bold text-gray-700 mb-1">Oxy (mg/L)</label>
                                <input
                                type="number"
                                name="oxygen"
                                placeholder="VD: 5.0"
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={form.oxygen}
                                onChange={handleChange}
                                required
                                step="0.1"
                                />
                            </div>
                            <div className="flex flex-col w-1/2">
                                <label className="text-sm font-bold text-gray-700 mb-1">Độ đục (NTU)</label>
                                <input
                                type="number"
                                name="turbidity"
                                placeholder="VD: 10"
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={form.turbidity}
                                onChange={handleChange}
                                required
                                />
                            </div>
                        </div>

                        {/* Nút bấm ngang hàng */}
                        <div className="flex space-x-3 pt-4 border-t mt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                {popupType === "create" ? "Lưu lại" : "Cập nhật"}
                            </button>
                            <button
                                type="button"
                                onClick={closePopup}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </form>
                    </>
                )}

                {/* DELETE */}
                {popupType === "delete" && (
                    <>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">
                        Xóa chỉ số đo?
                    </h2>
                    <p className="mb-4 text-gray-700">Bạn có chắc muốn xóa bản ghi đo lường của <strong>{selectedRecord?.tankId?.name}</strong> không?</p>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleDelete}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                        >
                            Xóa
                        </button>
                        <button
                            onClick={closePopup}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
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

