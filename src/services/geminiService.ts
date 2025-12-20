
import { GoogleGenAI } from "@google/genai";

/**
 * Generates insights for management based on context data and a user query.
 */
export const generateManagerInsight = async (contextData: string, query: string) => {
  try {
    // Create a new GoogleGenAI instance right before making an API call to ensure current API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use gemini-3-pro-preview for complex reasoning and data analysis tasks
    const modelName = "gemini-3-pro-preview";
    
    const systemInstruction = `
      Bạn là một trợ lý ảo chuyên nghiệp dành cho Quản lý (Manager).
      Hãy phân tích dữ liệu và đưa ra câu trả lời ngắn gọn, súc tích, chuyên nghiệp bằng Tiếng Việt.
      Nếu là đề xuất hành động, hãy gạch đầu dòng rõ ràng.
    `;

    const prompt = `
      Dưới đây là dữ liệu hiện tại của hệ thống (định dạng JSON):
      ${contextData}

      Người dùng (Quản lý) hỏi: "${query}"
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // Directly access the .text property from the response
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Xin lỗi, hiện tại tôi không thể xử lý yêu cầu này. Vui lòng kiểm tra lại kết nối hoặc API Key.";
  }
};

/**
 * Rewrites a given overtime reason to be more professional using Gemini AI.
 */
export const rewriteOvertimeReason = async (originalReason: string) => {
  try {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = "gemini-3-flash-preview";

    const systemInstruction = `
      Hãy viết lại lý do tăng ca sau đây cho chuyên nghiệp, ngắn gọn, phù hợp với môi trường doanh nghiệp (Corporate style) bằng Tiếng Việt.
      Chỉ trả về nội dung lý do đã viết lại, không thêm lời dẫn.
    `;

    const prompt = `Lý do gốc: "${originalReason}"`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // Access the .text property (not a method) and trim the result
    return response.text?.trim() || originalReason;
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    return originalReason;
  }
};
