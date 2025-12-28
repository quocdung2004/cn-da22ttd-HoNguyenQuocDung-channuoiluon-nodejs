import { useState, useRef, useEffect } from "react";
import axios from "axios";
// Sử dụng các icon đơn giản (hoặc cài lucide-react)
import { MessageSquare, X, Send, Bot, AlertTriangle } from "lucide-react"; 

export default function AIConsultant({ contextData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "Xin chào! Tôi là trợ lý ảo AquaEel. Bạn cần tư vấn kỹ thuật nuôi hay xử lý bệnh cho lươn không?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Lấy token từ localStorage (để xác thực với Backend)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : "";

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isOpen]);

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Gửi request kèm Token trong Header
      const res = await axios.post(
        "http://localhost:5000/api/ai/consult", 
        {
          question: input,
          contextData: contextData // Gửi kèm dữ liệu bể (nếu có)
        },
        {
          headers: { Authorization: `Bearer ${token}` } // 🔑 QUAN TRỌNG: Thêm header xác thực
        }
      );

      const aiMsg = { role: "ai", text: res.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      let errorText = "Xin lỗi, tôi đang gặp sự cố kết nối.";
      
      if (error.response) {
          if (error.response.status === 401) errorText = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
          else if (error.response.status === 500) errorText = "Hệ thống AI đang bảo trì, vui lòng thử lại sau.";
          else errorText = error.response.data?.message || errorText;
      }
      
      setMessages((prev) => [...prev, { role: "ai", text: errorText }]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý phím Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* 1. CỬA SỔ CHAT (Hiện khi isOpen = true) */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trợ Lý Kỹ Thuật</h3>
                <span className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
              <X size={18} />
            </button>
          </div>

          {/* Body (Danh sách tin nhắn) */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            
            {/* Thông báo ngữ cảnh (Nếu đang ở trang chi tiết bể) */}
            {contextData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800 flex gap-2 items-start">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>
                        Đang phân tích dữ liệu bể: <strong>{contextData.tankName}</strong> <br/>
                        (pH: {contextData.ph}, Nhiệt độ: {contextData.temperature}°C)
                    </span>
                </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[80%] p-3 text-sm rounded-2xl shadow-sm ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                  }`}
                >
                  {/* Hiển thị xuống dòng cho câu trả lời dài */}
                  <p style={{ whiteSpace: "pre-line" }}>{msg.text}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer (Input) */}
          <div className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 2. NÚT KÍCH HOẠT (Bong bóng) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'scale-0' : 'scale-100'} transition-transform duration-300 w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl hover:brightness-110 active:scale-95`}
      >
        <MessageSquare size={28} />
      </button>
    </div>
  );
}