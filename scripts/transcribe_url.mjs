import { DeepgramClient } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  console.error('Set DEEPGRAM_API_KEY in environment before running.');
  process.exit(1);
}

const url = process.argv[2] || 'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav';
const model = process.argv[3] || 'nova-3';

const transcribe = async () => {
  try {
    const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });

    const res = await deepgram.listen.v1.media.transcribeUrl({
      url,
      model,
      language: 'en',
      smart_format: true,
    });

    console.log('Transcription result:');
    console.dir(res, { depth: null });
  } catch (err) {
    console.error('Transcription failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
};

transcribe();
