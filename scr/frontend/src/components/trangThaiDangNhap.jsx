import React, { createContext, useState, useEffect } from 'react';

// Tạo Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Lấy trạng thái ban đầu từ localStorage (giả định token tồn tại là đã đăng nhập)
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Cập nhật trạng thái khi token thay đổi (ví dụ: sau khi login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };

    // Lắng nghe sự kiện storage (dùng cho các tab khác nhau)
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Hàm đăng nhập (giả định)
  const login = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    // Chuyển hướng người dùng về trang chủ
    window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};