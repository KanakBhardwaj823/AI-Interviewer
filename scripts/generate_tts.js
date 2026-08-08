import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { createClient } from '@deepgram/sdk';

const DEFAULT_TEXT = `Your lab results show elevated cholesterol levels of 240 mg/dL; I recommend starting Atorvastatin 10 mg daily and scheduling a follow-up in eight weeks to reassess.`;
const MODEL = 'aura-2-odysseus-en';
const OUT_FILE = 'audio.mp3';

const text = process.argv.slice(2).join(' ') || DEFAULT_TEXT;

(async () => {
  try {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Set DEEPGRAM_API_KEY in your environment before running this script.');
    }

    const deepgram = createClient(DEEPGRAM_API_KEY);

    // Try SDK v1 audio.generate path first
    try {
      const result = await deepgram.speak?.v1?.audio.generate?.({ text, model: MODEL });
      if (result && typeof result.stream === 'function') {
        const webStream = result.stream();
        const nodeStream = (Readable as any).fromWeb ? (Readable as any).fromWeb(webStream) : Readable.from(webStream as any);
        await pipeline(nodeStream, createWriteStream(OUT_FILE));
        console.log(`Audio saved to ${OUT_FILE} (SDK)`);
        return;
      }
    } catch (sdkErr) {
      console.warn('SDK TTS path failed, falling back to REST TTS:', sdkErr.message || sdkErr);
    }

    // REST fallback
    const ttsUrl = `https://api.deepgram.com/v1/speech?model=${encodeURIComponent(MODEL)}`;
    const dgResp = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!dgResp.ok) {
      const txt = await dgResp.text().catch(() => '');
      throw new Error(`Deepgram REST TTS error ${dgResp.status}: ${txt}`);
    }

    const buffer = Buffer.from(await dgResp.arrayBuffer());

    // If response is already an audio stream, write it directly
    await pipeline(Readable.from(buffer), createWriteStream(OUT_FILE));
    console.log(`Audio saved to ${OUT_FILE} (REST fallback)`);
  } catch (err) {
    console.error('TTS generation failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
