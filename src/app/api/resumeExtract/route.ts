import {NextResponse} from "next/server";
import PDFParser from "pdf2json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {error: "Resume extraction requires a POST upload request."},
    {status: 405}
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({error: "No resume file provided"}, {status: 400});
    }

    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({error: "Please upload a PDF resume"}, {status: 400});
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParser(null, true);

    const text = await new Promise<string>((resolve, reject) => {
      parser.on("pdfParser_dataReady", () => {
        try {
          const rawText = parser.getRawTextContent();
          resolve((rawText || "").replace(/\s+/g, " ").trim());
        } catch (error) {
          reject(error);
        }
      });

      parser.on("pdfParser_dataError", (err) => {
        const parserError = err instanceof Error ? err : err?.parserError;
        reject(parserError || new Error("Resume extraction failed"));
      });

      try {
        parser.parseBuffer(buffer);
      } catch (error) {
        reject(error);
      }
    });

    if (!text) {
      return NextResponse.json({error: "Could not extract text from the PDF"}, {status: 400});
    }

    return NextResponse.json({text, fileName: file.name}, {status: 200});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume extraction failed";
    return NextResponse.json({error: message}, {status: 500});
  }
}