import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";

const ai = new GoogleGenAI({
  apiKey: env.gemini.apiKey,
});

function asApiErrorFromUnknown(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const err = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    code?: string;
    name?: string;
    message?: string;
  };

  if (err?.name === "AbortError" || err?.code === "ABORT_ERR") {
    return new ApiError(504, "AI step timed out before the model responded.");
  }

  const status = err?.statusCode ?? err?.status ?? err?.response?.status;
  if (status === 401 || status === 403) {
    return new ApiError(502, "AI step could not authenticate with the configured Gemini service.");
  }
  if (status === 429) {
    return new ApiError(503, "AI step is temporarily rate-limited. Please try again later.");
  }
  if (status && status >= 500) {
    return new ApiError(503, "AI step is temporarily unavailable. Please try again later.");
  }

  return new ApiError(502, "AI step failed to generate a response.");
}

export async function generateAIResponse(prompt: string): Promise<string> {
  if (!env.gemini.apiKey) {
    throw new ApiError(503, "AI step is not configured. Set GEMINI_API_KEY on the server to enable AI actions.");
  }

  const model = env.gemini.model || "gemini-flash-latest";
  const timeoutMs = Number.isFinite(env.gemini.timeoutMs) && env.gemini.timeoutMs > 0 ? env.gemini.timeoutMs : 30000;

  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const err = new Error("AI step timed out");
      err.name = "AbortError";
      reject(err);
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: prompt,
      }),
      timeoutPromise,
    ]);

    const text = (response as { text?: string }).text ?? "";
    if (!text.trim()) {
      throw new ApiError(502, "AI step returned an empty response.");
    }
    return text;
  } catch (error) {
    throw asApiErrorFromUnknown(error);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}