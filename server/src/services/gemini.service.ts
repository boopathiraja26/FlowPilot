import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";
import { getGeminiCredentials } from "./integration.service";

export async function resolveGeminiApiKey(userId?: string): Promise<string> {
  const savedCredentials = userId
    ? await getGeminiCredentials(userId)
    : null;
  const apiKey = savedCredentials?.apiKey ?? env.gemini.apiKey;
  if (!apiKey) {
    throw new ApiError(500, "Gemini is not configured for this account or server.");
  }
  return apiKey;
}

export async function generateAIResponse(
  prompt: string,
  userId?: string
): Promise<string> {
  const apiKey = await resolveGeminiApiKey(userId);
  const ai = new GoogleGenAI({
    apiKey,
  });

  let response;
  try {
    response = await ai.models.generateContent({
      model: env.gemini.model,
      contents: prompt,
    });
  } catch {
    throw new ApiError(502, "Gemini request failed.");
  }

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}