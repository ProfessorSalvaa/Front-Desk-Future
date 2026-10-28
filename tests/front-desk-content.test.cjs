const assert = require('node:assert/strict');
const { test } = require('node:test');
const content = require('../js/front-desk-content.js');
const { tourSteps } = require('../js/front-desk.js');

test('the experience matches the five-topic format and uses short spoken captions', () => {
  assert.equal(content.topics.length, 5);
  assert.equal(content.topics[2].hotspots.length, 8);
  for (const [id, text] of Object.entries(content.clips())) {
    assert.ok(text.split(/\s+/).length <= 40, `${id}: no more than forty visible words`);
    assert.ok(text.length > 50);
  }
});

test('guided tour includes every introduction and interactive hotspot exactly once', () => {
  const steps = tourSteps(content.topics);
  assert.equal(steps.length, 34);
  assert.equal(new Set(steps.map(step => `${step.topic}:${step.hotspot}`)).size, steps.length);
  assert.deepEqual(steps[0], { topic: 0, hotspot: -1 });
  assert.deepEqual(steps.at(-1), { topic: 4, hotspot: 4 });
});
