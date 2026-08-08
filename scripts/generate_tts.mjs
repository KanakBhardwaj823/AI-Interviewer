import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { DeepgramClient } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  console.error('Set DEEPGRAM_API_KEY environment variable.');
  process.exit(1);
}

const text = process.argv.slice(2).join(' ') || `Your lab results show elevated cholesterol levels of 240 mg/dL; I recommend starting Atorvastatin 10 mg daily and scheduling a follow-up in eight weeks to reassess.`;
const outFile = process.argv[3] || 'audio.mp3';

async function main() {
  const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });

  try {
    // Preferred SDK method
    const result = await deepgram.speak?.v1?.audio.generate?.({
      text,
      model: 'aura-2-odysseus-en',
    });

    if (result && typeof result.stream === 'function') {
      const webStream = result.stream();
      const nodeStream = Readable.fromWeb(webStream);
      await pipeline(nodeStream, createWriteStream(outFile));
      console.log('Audio saved to', outFile);
      return;
    }

    // Fallback to REST TTS
    console.warn('SDK TTS not available; falling back to REST endpoint');
    const resp = await fetch('https://api.deepgram.com/v1/speech?model=aura-2-odysseus-en', {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Deepgram REST TTS error ${resp.status}: ${body}`);
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    // Write buffer to file
    await pipeline(Readable.from(buffer), createWriteStream(outFile));
    console.log('Audio saved to', outFile);
  } catch (err) {
    console.error('TTS generation failed:', err);
    process.exit(1);
  }
}

main();
