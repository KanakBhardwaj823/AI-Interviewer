import {NextResponse} from "next/server";
import {GoogleGenerativeAI} from "@google/generative-ai";
import rateLimiter from "@/utils/rateLimiter";
import {ROLE_SYSTEM_PROMPTS} from "@/utils/constants";

const DEFAULT_SYSTEM_PROMPT = `You are an AI interviewer conducting a realistic mock interview.

Your job is to:
1. Listen to the candidate's answer and connect the next question to what they just said.
2. Ask one clear, role-relevant follow-up question that feels natural and conversational.
3. Keep the tone professional, encouraging, and slightly human.

Guidelines:
- Reference the candidate's previous answer or key ideas when possible.
- If the answer is incomplete, ask for a specific missing detail rather than a generic prompt.
- If the answer is weak, invite a stronger example, trade-off, or metric.
- If the answer is off-topic, gently redirect to the role's core concepts.
- Do not provide long explanations; return only one concise interview question.
- Keep the question focused on depth, reasoning, and practical decision-making.`;

export async function POST(request: Request) {
  const clientId = request.headers.get("x-forwarded-for") || "anonymous";

  const rateLimitResult = rateLimiter.consume(clientId);
  if (!rateLimitResult.success) {
    return NextResponse.json({error: rateLimitResult.message}, {status: 429});
  }

  try {
    const {currentQuestion, answer, role, resumeText} = await request.json();
    const hasResume = typeof resumeText === "string" && resumeText.trim().length > 0;

    // Handle resume-based opening question
    if ((!answer || answer.trim().length < 10) && hasResume) {
      const systemPrompt =
        (role && ROLE_SYSTEM_PROMPTS[role as keyof typeof ROLE_SYSTEM_PROMPTS]) ||
        DEFAULT_SYSTEM_PROMPT;

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json({
          response:
            "Tell me about a project or experience from your resume that best represents your strengths for this role.",
        });
      }

      const gemini = new GoogleGenerativeAI(geminiApiKey);
      const modelName =
        process.env.GEMINI_MODEL && process.env.GEMINI_MODEL !== "gemini-2.5-flash"
          ? process.env.GEMINI_MODEL
          : "gemini-3.6-flash";
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      });

      const prompt = `System instructions:\n${systemPrompt}\n\nResume text:\n${resumeText}\n\nGenerate one opening interview question that feels tailored to this candidate's background. Ask about a project, skill, or experience from the resume that would help you evaluate them for the role. Return only one concise question.`;
      const result = await model.generateContent(prompt);
      const response = result?.response?.text?.() || "";

      if (!response) {
        return NextResponse.json({
          response:
            "What on your resume would you most like to highlight as evidence you’re a strong fit for this role?",
        });
      }

      return NextResponse.json({response}, {status: 200});
    }

    // Handle empty or invalid answers without resume context
    if (!answer || answer.trim().length < 10) {
      return NextResponse.json({
        response:
          "I didn't catch that. Could you please elaborate on your answer to the question: " +
          currentQuestion,
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      const fallbackResponse =
        "Thanks for your answer. What would you do next to improve your approach and validate its effectiveness?";
      return NextResponse.json({response: fallbackResponse}, {status: 200});
    }

    const systemPrompt =
      (role && ROLE_SYSTEM_PROMPTS[role as keyof typeof ROLE_SYSTEM_PROMPTS]) ||
      DEFAULT_SYSTEM_PROMPT;

    const gemini = new GoogleGenerativeAI(geminiApiKey);
    const modelName =
      process.env.GEMINI_MODEL && process.env.GEMINI_MODEL !== "gemini-2.5-flash"
        ? process.env.GEMINI_MODEL
        : "gemini-3.6-flash";
    const model = gemini.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const prompt = `System instructions:\n${systemPrompt}\n\nCurrent question:\n${currentQuestion}\n\nCandidate answer:\n${answer}\n\nGenerate the next interviewer question. It should feel connected to the candidate's answer and should move the conversation forward. Return only one direct question.`;
    const result = await model.generateContent(prompt);
    const response = result?.response?.text?.() || "";

    // Validate response is not empty
    if (!response) {
      const fallbackResponse =
        "Could you expand on your answer with a concrete example, a trade-off, or the outcome you would expect?";
      return NextResponse.json({response: fallbackResponse}, {status: 200});
    }

    return NextResponse.json({response}, {status: 200});
  } catch (error) {
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      if (typeof err === "object" && err !== null) {
        if ("message" in err) {
          const message = (err as {message?: unknown}).message;
          if (typeof message === "string") {
            return message;
          }
        }
        try {
          return JSON.stringify(err);
        } catch {
          return String(err);
        }
      }
      return String(err);
    };

    const errorMessage = getErrorMessage(error);
    const isRateLimitError = /429|rate limit|too many requests|quota/i.test(
      errorMessage
    );

    console.error("LLM generation error:", errorMessage);

    if (isRateLimitError) {
      const retryMatch = errorMessage.match(/retry.*?(\d+(?:\.\d+)?)\s*s/i);
      const retrySeconds = retryMatch ? Math.ceil(Number(retryMatch[1])) : null;
      const retryText = retrySeconds
        ? ` Please try again in about ${retrySeconds} seconds.`
        : " Please try again shortly.";

      return NextResponse.json(
        {
          error: "LLM rate limit exceeded",
          response:
            "I’m temporarily unable to generate the next question due to request limits." +
            retryText,
        },
        {status: 200}
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate response",
        response:
          "Could you expand on your answer with a concrete example, a trade-off, or the outcome you would expect?",
      },
      {status: 200}
    );
  }
}
