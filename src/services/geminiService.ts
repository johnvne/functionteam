
import { GoogleGenAI } from "@google/genai";

/**
 * Generates an insight response from the AI model based on system context and user query.
 * @param context Information about the user's current session or role.
 * @param query The user's input/question.
 * @returns The generated text from the model.
 */
export const generateManagerInsight = async (context: string, query: string): Promise<string> => {
  try {
    // Khởi tạo client bên trong hàm để đảm bảo biến môi trường đã sẵn sàng
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Sử dụng model gemini-3-flash-preview cho các tác vụ tư vấn nhanh
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${context}\nUser Question: ${query}`,
      config: {
        systemInstruction: "You are an AI assistant for a business management dashboard. Help users understand system data and perform tasks efficiently. Respond in Vietnamese.",
      },
    });

    // Trả về nội dung văn bản trực tiếp từ response
    return response.text || "Không tìm thấy câu trả lời phù hợp.";
  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    return "Đã có lỗi xảy ra khi kết nối với máy chủ AI. Vui lòng thử lại sau.";
  }
};
