import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";  // <-- phải import file css ở đây
import { AuthProvider } from './components/trangThaiDangNhap';
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
