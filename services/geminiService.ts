import { GoogleGenAI } from "@google/genai";
import { ProjectTask, DailyTask } from '../types';

export const analyzeProductivity = async (
  projectTasks: ProjectTask[], 
  dailyTasks: DailyTask[]
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    return "API Key is missing. Please ensure your Gemini API Key is set in the environment.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze the following Task Management data and provide a concise executive summary and 3 actionable tips to improve productivity.
    
    Project Tasks Overview:
    ${JSON.stringify(projectTasks.map(t => ({ project: t.projectName, status: t.status })))}

    Daily Tasks Overview:
    ${JSON.stringify(dailyTasks.map(t => ({ name: t.taskName, duration: t.duration, status: t.status })))}

    Return the response in Markdown format. Keep it professional and motivating.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "Failed to generate AI insights. Please try again later.";
  }
};