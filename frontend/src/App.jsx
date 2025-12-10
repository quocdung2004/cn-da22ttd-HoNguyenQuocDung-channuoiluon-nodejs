import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import BeNuoi from "./pages/BeNuoi.jsx";
import MoiTruong from "./pages/MoiTruong.jsx";
import SucKhoe from "./pages/SucKhoe.jsx";
import TaiChinh from "./pages/TaiChinh.jsx";
import GiongLuon from "./pages/GiongLuon.jsx";
import Thuoc from "./pages/Thuoc.jsx";
import ThucAn from "./pages/ThucAn.jsx";
import NhatKyChoAn from "./pages/NhatKyChoAn.jsx";
import ChiPhiVanHanh from "./pages/ChiPhiVanHanh.jsx";
import XuatBan from "./pages/XuatBan.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/GiongLuon" element={<GiongLuon />} />
        <Route path="/BeNuoi" element={<BeNuoi />} />
        <Route path="/MoiTruong" element={<MoiTruong />} />
        <Route path="/SucKhoe" element={<SucKhoe />} />
        <Route path="/TaiChinh" element={<TaiChinh />} />
        <Route path="/Thuoc" element={<Thuoc />} />
        <Route path="/ThucAn" element={<ThucAn />} />
        <Route path="/NhatKyChoAn" element={<NhatKyChoAn />} />
        <Route path="/ChiPhiVanHanh" element={<ChiPhiVanHanh />} />
        <Route path="/XuatBan" element={<XuatBan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
