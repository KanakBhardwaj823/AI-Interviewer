import {NextResponse} from "next/server";
import rateLimiter from "@/utils/rateLimiter";

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_TTS_TIMEOUT_MS = 9000;

const createSilentWavBuffer = (durationMs = 500) => {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = Math.ceil((sampleRate * durationMs) / 1000) * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
};

export async function POST(request: Request) {
  const clientId = request.headers.get("x-forwarded-for") || "anonymous";

  const rateLimitResult = rateLimiter.consume(clientId);
  if (!rateLimitResult.success) {
    return NextResponse.json({error: rateLimitResult.message}, {status: 429});
  }

  try {
    const {text} = await request.json();

    if (!text) {
      return NextResponse.json({error: "No text provided"}, {status: 400});
    }

    if (!deepgramApiKey) {
      console.error("DEEPGRAM_API_KEY is not configured for text-to-speech");
      return NextResponse.json(
        {error: "Text-to-speech service is not configured."},
        {status: 500}
      );
    }

    // Use the REST endpoint for compatibility with the installed Deepgram SDK version.
    const ttsUrl = `https://api.deepgram.com/v1/speak?model=aura-asteria-en`;
    const timeoutSignal = AbortSignal.timeout(DEEPGRAM_TTS_TIMEOUT_MS);
    const dgResp = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({text}),
      signal: timeoutSignal,
    });

    if (dgResp.status === 401 || dgResp.status === 403) {
      const txt = await dgResp.text().catch(() => "");
      console.error("Deepgram TTS authentication failed:", {
        status: dgResp.status,
        statusText: dgResp.statusText,
        body: txt,
      });
      return NextResponse.json(
        {error: "Text-to-speech authentication failed."},
        {status: 401}
      );
    }

    if (!dgResp.ok) {
      const txt = await dgResp.text().catch(() => "");
      // Log full diagnostic info to help debugging model/endpoint issues
      console.error("Deepgram TTS REST responded with error:", {
        status: dgResp.status,
        statusText: dgResp.statusText,
        headers: Object.fromEntries(dgResp.headers.entries()),
        body: txt,
      });

      // Do not throw here — return a silent audio fallback so UI continues to work.
      return createAudioResponse(createSilentWavBuffer());
    }

    const respBuffer = Buffer.from(await dgResp.arrayBuffer());
    const respContentType = dgResp.headers.get("content-type") || "audio/mpeg";
    return new NextResponse(respBuffer, {
      headers: {
        "Content-Type": respContentType,
        "Content-Length": respBuffer.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Text-to-speech failed";

    if (
      error instanceof Error &&
      (error.name === "AbortError" ||
        error.name === "TimeoutError" ||
        message.includes("Connect Timeout Error") ||
        message.toLowerCase().includes("timed out"))
    ) {
      console.warn("Deepgram TTS request timed out; using silent fallback.");
      return createAudioResponse(createSilentWavBuffer());
    }

    console.error("Text-to-speech error:", error);
    if (message.toLowerCase().includes("401") || message.toLowerCase().includes("unauthoriz")) {
      return NextResponse.json(
        {error: "Text-to-speech authentication failed."},
        {status: 401}
      );
    }
    // Fallback: return a silent audio to avoid breaking audio consumers
    return createAudioResponse(createSilentWavBuffer());
  }
}

const createAudioResponse = (audioBuffer: Buffer) => {
  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.length.toString(),
    },
  });
};
