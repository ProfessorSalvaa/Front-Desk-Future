import { KokoroTTS } from 'kokoro-js';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const content = require('../../js/front-desk-content.js');
const output = new URL('../../audio/front-desk/', import.meta.url);
await mkdir(output, { recursive: true });
const model = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const voice = 'af_heart';
const tts = await KokoroTTS.from_pretrained(model, { dtype: 'q8', device: 'cpu' });
const manifest = { model, voice, speed: 0.94, clips: {} };
const manifestPath = new URL('manifest.json', output);
let previous = { clips: {} };
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

function wav(samples, sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, index) => {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + index * 2);
  });
  return buffer;
}

for (const [id, text] of Object.entries(content.clips())) {
  const hash = createHash('sha256').update(`${model}|${voice}|${manifest.speed}|${text}`).digest('hex');
  const path = new URL(`${id}.wav`, output);
  if (previous.clips[id]?.hash === hash) {
    try {
      const saved = await readFile(path);
      if (saved.length < 44) throw new Error(`Invalid existing recording: ${id}`);
      manifest.clips[id] = previous.clips[id];
      console.log(`Reused ${id}`);
      continue;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      console.log(`Regenerating missing local master: ${id}`);
    }
  }
  const audio = await tts.generate(text, { voice, speed: manifest.speed });
  const samples = audio.audio;
  const sampleRate = audio.sampling_rate;
  if (!(samples instanceof Float32Array) || !Number.isFinite(sampleRate) || samples.length < sampleRate) {
    throw new Error(`Invalid generated audio: ${id}`);
  }
  let peak = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) throw new Error(`Non-finite audio sample: ${id}`);
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak < 0.01) throw new Error(`Silent generated recording: ${id}`);
  await writeFile(path, wav(samples, sampleRate));
  manifest.clips[id] = { hash, seconds: samples.length / sampleRate, sampleRate, peak };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generated ${id}: ${manifest.clips[id].seconds.toFixed(1)}s`);
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Saved ${Object.keys(manifest.clips).length} local recordings to ${fileURLToPath(output)}`);
