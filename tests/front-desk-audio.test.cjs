const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { runInNewContext } = require('node:vm');
const content = require('../js/front-desk-content.js');
const { createEnvelope, voiceAt } = require('../js/front-desk.js');

test('bundled narration contains valid, non-silent PCM for every exact caption', () => {
  const source = readFileSync(resolve(__dirname, '../js/front-desk-audio.js'), 'utf8');
  const manifest = JSON.parse(readFileSync(resolve(__dirname, '../audio/front-desk/manifest.json'), 'utf8'));
  const context = {};
  runInNewContext(source, context);
  const audio = context.FrontDeskAudio;
  const scripts = content.clips();
  assert.equal(Object.keys(audio).length, 50);
  assert.deepEqual(Object.keys(audio).sort(), Object.keys(scripts).sort());
  assert.ok(Buffer.byteLength(source) < 40 * 1024 * 1024);
  for (const [id, text] of Object.entries(scripts)) {
    assert.match(audio[id], /^data:audio\/wav;base64,/);
    const bytes = Buffer.from(audio[id].split(',')[1], 'base64');
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', id);
    assert.equal(bytes.toString('ascii', 8, 12), 'WAVE', id);
    assert.equal(bytes.readUInt16LE(20), 1, 'PCM');
    assert.equal(bytes.readUInt16LE(22), 1, 'mono');
    assert.equal(bytes.readUInt16LE(34), 16, '16-bit samples');
    assert.equal(bytes.readUInt32LE(40), bytes.length - 44);
    const seconds = (bytes.length - 44) / 2 / bytes.readUInt32LE(24);
    assert.ok(seconds >= 5 && seconds <= 25, `${id}: natural short-passage duration`);
    assert.ok(Math.abs(seconds - manifest.clips[id].seconds) < 0.001);
    let energy = 0;
    const samples = new Float32Array((bytes.length - 44) / 2);
    for (let offset = 44; offset < bytes.length; offset += 2) {
      const sample = bytes.readInt16LE(offset) / 32768;
      samples[(offset - 44) / 2] = sample;
      energy += sample ** 2;
    }
    assert.ok(Math.sqrt(energy / ((bytes.length - 44) / 2)) > 0.005, `${id}: audible signal`);
    const envelope = context.FrontDeskEnvelopes[id];
    const expected = createEnvelope(samples, bytes.readUInt32LE(24));
    assert.equal(envelope.fps, expected.fps);
    assert.deepEqual(Array.from(envelope.values), expected.values, `${id}: animation matches actual PCM energy`);
    assert.ok(envelope.values.some(value => value > 0.8));
    assert.ok(envelope.values.some(value => value === 0), `${id}: speech pauses remain still`);
    assert.equal(voiceAt(envelope, 0.5, false), 0);
    const hash = createHash('sha256').update(`${manifest.model}|${manifest.voice}|${manifest.speed}|${text}`).digest('hex');
    assert.equal(manifest.clips[id].hash, hash, `${id}: regenerate audio after caption edits`);
  }
});
