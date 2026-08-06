import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "PASTE_YOUR_CURRENT_AQ_KEY_HERE",
});

async function test() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say hello",
    });

    console.log(res.text);
  } catch (err) {
    console.error(err);
  }
}

test();