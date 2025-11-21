import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import BeNuoi from "./pages/BeNuoi.jsx";
import MoiTruong from "./pages/MoiTruong.jsx";
import NhatKyAn from "./pages/NhatKyAn.jsx";
import SucKhoe from "./pages/SucKhoe.jsx";
import TaiChinh from "./pages/TaiChinh.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/BeNuoi" element={<BeNuoi />} />
        <Route path="/MoiTruong" element={<MoiTruong />} />
        <Route path="/NhatKyAn" element={<NhatKyAn />} />
        <Route path="/SucKhoe" element={<SucKhoe />} />
        <Route path="/TaiChinh" element={<TaiChinh />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
