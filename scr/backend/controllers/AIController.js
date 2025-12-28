// backend/controllers/AIController.js

// Hàm phụ: Tự động tìm model khả dụng
async function findValidModel(apiKey) {
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(listUrl);
    const data = await response.json();

    if (!response.ok || !data.models) {
      console.error("⚠️ Không lấy được danh sách model:", data);
      return "gemini-pro"; // Fallback nếu lỗi
    }

    // Lọc ra các model hỗ trợ tạo văn bản (generateContent)
    const validModels = data.models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes("generateContent")
    );

    console.log("📋 Danh sách Model Key này dùng được:", validModels.map(m => m.name));

    // Ưu tiên chọn model mới nhất
    // Tìm 1.5-flash -> 1.5-pro -> gemini-pro -> cái đầu tiên tìm thấy
    const preferred = [
        "models/gemini-1.5-flash",
        "models/gemini-1.5-pro",
        "models/gemini-1.0-pro",
        "models/gemini-pro"
    ];

    for (const pref of preferred) {
        if (validModels.find(m => m.name === pref)) return pref.replace("models/", "");
    }

    // Nếu không có cái nào trong danh sách ưu tiên, lấy cái đầu tiên tìm được
    if (validModels.length > 0) return validModels[0].name.replace("models/", "");

    return "gemini-pro"; // Đường cùng
  } catch (e) {
    console.error("Lỗi tìm model:", e);
    return "gemini-pro";
  }
}

exports.getAdvice = async (req, res) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ message: "Thiếu API KEY" });

  try {
    const { question, contextData } = req.body;
    console.log("🤖 Đang tìm model phù hợp...");

    // 1. Tự động chọn model
    const modelName = await findValidModel(API_KEY);
    console.log(`👉 Đã chọn model: [${modelName}]`);

    // 2. Tạo Prompt
    let prompt = `
      Đóng vai chuyên gia kỹ sư thủy sản nuôi lươn. 
      Trả lời ngắn gọn (dưới 150 từ), súc tích, thực tế cho câu hỏi: "${question}"
    `;
    if (contextData) {
      prompt += `\nThông tin bể: ${contextData.tankName || ''}. pH: ${contextData.ph || '?'}, Nhiệt độ: ${contextData.temperature || '?'}°C.`;
    }

    // 3. Gọi API với model vừa tìm được
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Lỗi Google API");
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI không trả lời.";
    console.log("✅ AI trả lời OK!");
    
    res.json({ answer });

  } catch (error) {
    console.error("❌ Lỗi AI:", error.message);
    res.status(500).json({ message: "Lỗi: " + error.message });
  }
};