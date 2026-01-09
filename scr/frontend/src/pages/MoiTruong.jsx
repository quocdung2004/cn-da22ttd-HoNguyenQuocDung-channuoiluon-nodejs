import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function EnvironmentManager() {
    // --- Cấu hình API và Token ---
    const API_ENV = "http://localhost:5000/api/MoiTruong";
    const API_TANK = "http://localhost:5000/api/tank";
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "mock-token";

    // --- State Quản lý dữ liệu và UI ---
    const [environments, setEnvironments] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    // --- Hàm hỗ trợ tìm kiếm không dấu ---
    const removeAccents = (str) => {
        if (!str) return "";
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    };

    // --- Logic lọc dữ liệu ---
    const filteredEnvironments = environments.filter((env) => {
        if (!searchTerm) return true;
        const lowerTerm = removeAccents(searchTerm);

        // Tìm theo Tên bể, pH, Nhiệt độ, Oxy, Độ đục
        // Chuyển các số sang string để so sánh
        return (
            removeAccents(env.tankId?.name || "").includes(lowerTerm) ||
            (env.pH !== undefined && env.pH.toString().includes(lowerTerm)) ||
            (env.temperature !== undefined && env.temperature.toString().includes(lowerTerm)) ||
            (env.oxygen !== undefined && env.oxygen.toString().includes(lowerTerm)) ||
            (env.turbidity !== undefined && env.turbidity.toString().includes(lowerTerm))
        );
    });

    // --- Hàm xử lý thay đổi Input (Chuyển đổi sang Number) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({
            ...prevForm,
            [name]: value === "" ? "" : Number(value),
        }));
    };

    // --- Chức năng Load Data ---
    const fetchData = useCallback(async () => {
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

    // --- Xử lý Submit (Thêm mới/Cập nhật) ---
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
            // Demo fallback
            fetchData();
            closePopup();
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
            // Demo fallback
            const newEnvs = environments.filter(e => e._id !== selectedRecord._id);
            setEnvironments(newEnvs);
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

    // --- Phần Render Component ---
    return (
        <Layout>
            <div className="p-6">
                {/* HEADER & THANH TÌM KIẾM */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-blue-600 shrink-0">Quản lý Môi Trường</h1>

                    <div className="flex w-full md:w-auto gap-3 items-center">
                        {/* THANH TÌM KIẾM */}
                        <div className="relative flex-1 md:w-72">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm bể, pH, nhiệt độ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600 outline-none"
                            />
                        </div>

                        <button
                            onClick={() => openPopup("create")}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shrink-0 shadow-md font-bold flex items-center"
                        >
                            <span className="mr-1 text-xl">+</span> Thêm Chỉ Số
                        </button>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <p className="text-center text-gray-600">Đang tải...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden table-fixed border-collapse">
                            <thead className="bg-blue-500 text-white">
                                <tr>
                                    <th className="py-3 px-4 text-center w-[60px]">STT</th>
                                    <th className="py-3 px-4 text-left w-[200px]">Bể</th>
                                    <th className="py-3 px-4 text-center w-[100px]">pH</th>
                                    <th className="py-3 px-4 text-center w-[120px]">Nhiệt độ (°C)</th>
                                    <th className="py-3 px-4 text-center w-[120px]">Oxy (mg/L)</th>
                                    <th className="py-3 px-4 text-center w-[120px]">Độ đục (NTU)</th>
                                    <th className="py-3 px-4 text-center w-[180px]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEnvironments.map((env, index) => (
                                    <tr key={env._id} className="border-b hover:bg-gray-100">
                                        <td className="py-3 px-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="py-3 px-4 font-medium truncate" title={env.tankId?.name}>{env.tankId?.name}</td>

                                        {/* Tô màu cảnh báo nếu chỉ số vượt ngưỡng */}
                                        <td className={`py-3 px-4 text-center font-bold ${env.pH < 6.5 || env.pH > 8.5 ? 'text-red-600' : 'text-green-600'}`}>
                                            {env.pH}
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-700">{env.temperature}</td>
                                        <td className="py-3 px-4 text-center text-gray-700">{env.oxygen}</td>
                                        <td className="py-3 px-4 text-center text-gray-700">{env.turbidity}</td>

                                        <td className="py-3 px-4">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => openPopup("view", env)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition shadow-sm" title="Xem">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                                <button onClick={() => openPopup("edit", env)} className="p-1.5 bg-amber-100 text-amber-600 rounded-md hover:bg-amber-200 transition shadow-sm" title="Sửa">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => openPopup("delete", env)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition shadow-sm" title="Xóa">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEnvironments.length === 0 && (
                                    <tr><td colSpan="7" className="text-center p-8 text-gray-500 italic">Không tìm thấy dữ liệu môi trường.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* POPUP */}
                {showPopup && (
                    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
                        <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative max-h-[90vh] overflow-y-auto">

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
                                    <button onClick={closePopup} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Đóng</button>
                                </>
                            )}

                            {/* CREATE / EDIT */}
                            {(popupType === "create" || popupType === "edit") && (
                                <>
                                    <h2 className="text-2xl font-bold text-blue-600 mb-4">{popupType === "create" ? "Thêm mới chỉ số" : "Cập nhật chỉ số"}</h2>
                                    <form onSubmit={handleSubmit} className="space-y-3">

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

                                        <div className="flex gap-2">
                                            <div className="flex flex-col w-1/2">
                                                <label className="text-sm font-bold text-gray-700 mb-1">Độ pH</label>
                                                <input type="number" name="pH" placeholder="VD: 7.5" className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.pH} onChange={handleChange} required step="0.1" />
                                            </div>
                                            <div className="flex flex-col w-1/2">
                                                <label className="text-sm font-bold text-gray-700 mb-1">Nhiệt độ (°C)</label>
                                                <input type="number" name="temperature" placeholder="VD: 28" className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.temperature} onChange={handleChange} required step="0.1" />
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="flex flex-col w-1/2">
                                                <label className="text-sm font-bold text-gray-700 mb-1">Oxy (mg/L)</label>
                                                <input type="number" name="oxygen" placeholder="VD: 5.0" className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.oxygen} onChange={handleChange} required step="0.1" />
                                            </div>
                                            <div className="flex flex-col w-1/2">
                                                <label className="text-sm font-bold text-gray-700 mb-1">Độ đục (NTU)</label>
                                                <input type="number" name="turbidity" placeholder="VD: 10" className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.turbidity} onChange={handleChange} required />
                                            </div>
                                        </div>

                                        <div className="flex space-x-3 pt-4 border-t mt-2">
                                            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">{popupType === "create" ? "Lưu lại" : "Cập nhật"}</button>
                                            <button type="button" onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy bỏ</button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {/* DELETE */}
                            {popupType === "delete" && (
                                <>
                                    <h2 className="text-2xl font-bold text-red-600 mb-4">Xóa chỉ số đo?</h2>
                                    <p className="mb-4 text-gray-700">Bạn có chắc muốn xóa bản ghi đo lường của <strong>{selectedRecord?.tankId?.name}</strong> không?</p>
                                    <div className="flex space-x-3">
                                        <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Xóa</button>
                                        <button onClick={closePopup} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Hủy</button>
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