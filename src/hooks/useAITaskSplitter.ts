import { useState } from 'react';

// 定义 AI 返回的数据结构
interface SubTaskResult {
  title: string;
  description: string;
}

export const useAITaskSplitter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 主函数：接收 任务名、API Key、模式
  const splitTaskWithAI = async (taskTitle: string, apiKey: string, mode: 'mock' | 'real') => {
    setIsLoading(true); 
    setError(null);     
    
    try {
      // === 分支 A：模拟模式 (Mock) ===
      if (mode === 'mock') {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 假装思考 1.5秒
        return [
          { title: `调研: ${taskTitle} 的相关资料`, description: '了解背景和现有解决方案' },
          { title: `设计: ${taskTitle} 的初步方案`, description: '确定技术栈和核心功能' },
          { title: `执行: 开始 ${taskTitle} 的第一步`, description: '搭建环境并编写 Demo' },
          { title: `复盘: 检查 ${taskTitle} 的完成度`, description: '查漏补缺，优化细节' },
        ];
      }

      // === 分支 B：真实模式 (Real) ===
      // 真正的 Key 是通过参数 `apiKey` 传进来的
      if (!apiKey) throw new Error("请在输入框中填入有效的 Gemini API Key");

      // 2. Prompt Engineering 
      const prompt = `
        你是一个高效的任务规划助手。请将任务 "${taskTitle}" 拆解为 3 到 5 个具体的子任务。
        要求：
        1. 返回格式必须是纯 JSON 数组。
        2. 数组中每个对象包含 "title" (子任务标题) 和 "description" (简短描述)。
        3. 不要包含 Markdown 格式（如 \`\`\`json），只返回纯文本 JSON。
        4. 语言使用中文。
      `;

      // 3. 发起网络请求 (Fetch)
      // 这里的 ${apiKey} 就是把刚才传进来的 Key 拼接到 URL 上
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      // 4. 错误处理
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'API 请求失败');
      }

      // 5. 解析数据
      const data = await response.json();
      
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) throw new Error("AI 未返回有效内容");

      // 6. 数据清洗 
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      // 7. 最终转换
      // 把字符串 "[{...}, {...}]" 变成真正的 JavaScript 数组对象
      const subtasks: SubTaskResult[] = JSON.parse(cleanJson);
      
      return subtasks;

    } catch (err) {
      console.error("AI Error:", err);
      setError(err instanceof Error ? err.message : 'AI 服务暂时不可用');
      return []; 
    } finally {
      setIsLoading(false);
    }
  };

  return { splitTaskWithAI, isLoading, error };
};