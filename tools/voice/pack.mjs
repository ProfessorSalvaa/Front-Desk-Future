import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const content = createRequire(import.meta.url)('../../js/front-desk-content.js');
const { createEnvelope } = createRequire(import.meta.url)('../../js/front-desk.js');
const output = new URL('../../audio/front-desk/', import.meta.url);
const recordings = {}, envelopes = {};
for (const id of Object.keys(content.clips())) {
  const input = new URL(id + '.wav', output);
  const bytes = await readFile(input);
  if (bytes.length < 1000 || bytes.toString('ascii', 0, 4) !== 'RIFF') throw new Error('Invalid PCM recording: ' + id);
  if (bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 1 || bytes.readUInt16LE(34) !== 16 ||
      bytes.toString('ascii', 36, 40) !== 'data' || bytes.readUInt32LE(40) !== bytes.length - 44) {
    throw new Error('Expected generated 16-bit mono PCM: ' + id);
  }
  const samples = new Float32Array((bytes.length - 44) / 2);
  for (let n = 0; n < samples.length; n++) samples[n] = bytes.readInt16LE(44 + n * 2) / 32768;
  envelopes[id] = createEnvelope(samples, bytes.readUInt32LE(24));
  recordings[id] = 'data:audio/wav;base64,' + bytes.toString('base64');
}
await writeFile(new URL('../../js/front-desk-audio.js', import.meta.url),
  '// Generated locally by tools/voice/pack.mjs. Do not hand-edit.\nvar FrontDeskAudio = ' + JSON.stringify(recordings) +
  ';\nvar FrontDeskEnvelopes = ' + JSON.stringify(envelopes) + ';\n');
console.log(`Packed ${Object.keys(recordings).length} PCM recordings and synchronized motion envelopes.`);
