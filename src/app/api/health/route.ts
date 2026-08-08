import {NextResponse} from "next/server";
import {GoogleGenerativeAI} from "@google/generative-ai";

type HealthResult = {
  ok: boolean;
  error?: string;
  sample?: string;
};

export async function GET() {
  const results: Record<string, HealthResult> = {};

  // Check Gemini (LLM)
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      results["gemini"] = {ok: false, error: "GEMINI_API_KEY not configured"};
    } else {
      try {
        const client = new GoogleGenerativeAI(geminiApiKey);
        const modelName =
          process.env.GEMINI_MODEL && process.env.GEMINI_MODEL !== "gemini-2.5-flash"
            ? process.env.GEMINI_MODEL
            : "gemini-3.6-flash";
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {maxOutputTokens: 32},
        });
        const testPrompt = "Say hello";
        const res = await model.generateContent(testPrompt);
        const text = res?.response?.text?.() || null;
        results["gemini"] = text
          ? {ok: true, sample: text}
          : {ok: false, error: "Empty response"};
      } catch (err) {
        results["gemini"] = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  } catch (err) {
    results["gemini"] = {ok: false, error: String(err)};
  }

  return NextResponse.json(results);
}
