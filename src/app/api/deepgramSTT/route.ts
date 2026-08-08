import {NextResponse} from "next/server";
import {createClient} from "@deepgram/sdk";
import rateLimiter from "@/utils/rateLimiter";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export async function POST(request: Request) {
  const clientId = request.headers.get("x-forwarded-for") || "anonymous";

  const rateLimitResult = rateLimiter.consume(clientId);
  if (!rateLimitResult.success) {
    return NextResponse.json({error: rateLimitResult.message}, {status: 429});
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({error: "No audio file provided"}, {status: 400});
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const {result, error} = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        smart_format: true,
        model: "nova-3",
        language: "en",
        mimetype: audioFile.type || "audio/webm",
      }
    );

    if (error) {
      console.error("Deepgram STT SDK error:", error);
      return NextResponse.json({error: error.message || "Speech-to-text failed."}, {status: 500});
    }

    const transcription = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!transcription) {
      console.error("Speech-to-text returned empty transcript", result);
      return NextResponse.json({error: "No transcription could be generated."}, {status: 500});
    }

    return NextResponse.json({transcription}, {status: 200});
  } catch (error) {
    console.error("Speech-to-text error:", error);
    const message = error instanceof Error ? error.message : "Failed to transcribe audio";
    return NextResponse.json({error: message}, {status: 500});
  }
}
