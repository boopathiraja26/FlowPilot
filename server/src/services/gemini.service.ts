import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const ai = new GoogleGenAI({
  apiKey: env.gemini.apiKey,
});

export async function generateAIResponse(
  prompt: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: prompt,
  });

  return response.text ?? "";
}