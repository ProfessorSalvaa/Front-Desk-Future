const assert = require('node:assert/strict');
const { test } = require('node:test');
const { chooseVariant, createPlayer, createEnvelope, voiceAt, mount } = require('../js/front-desk.js');
const content = require('../js/front-desk-content.js');

class Element {
  constructor() {
    this.children = []; this.events = {}; this.attributes = {};
    this.hidden = false; this.textContent = ''; this.dataset = {}; this.style = { setProperty(name, value) { this[name] = value; } };
    this.classes = new Set();
    this.classList = {
      toggle: (name, value) => value ? this.classes.add(name) : this.classes.delete(name),
      contains: name => this.classes.has(name)
    };
    this.paused = true; this.currentTime = 0;
  }
  appendChild(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  querySelectorAll() { return this.children; }
  addEventListener(name, callback) { this.events[name] = callback; }
  emit(name, event = {}) { this.events[name]?.call(this, event); }
  setAttribute(name, value) { this.attributes[name] = value; }
  focus() { this.focused = true; }
  click() { this.emit('click'); }
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
  setPointerCapture() {}
  getBoundingClientRect() { return { width: 540 }; }
}

test('openings do not repeat within a visit sequence', () => {
  for (let previous = 0; previous < 3; previous++) {
    for (const value of [0, 0.5, 0.9999]) {
      const next = chooseVariant(3, previous, () => value);
      assert.notEqual(next, previous);
      assert.ok(next >= 0 && next < 3);
    }
  }
  assert.equal(chooseVariant(1, 0, () => 0), 0);
  assert.equal(chooseVariant(3, null, () => 0), 0);
});

test('voice motion is derived from PCM energy and playback position, including silence and seeks', () => {
  const samples = new Float32Array(2000);
  for (let i = 500; i < 1000; i++) samples[i] = i % 2 ? 0.3 : -0.3;
  const envelope = createEnvelope(samples, 1000);
  assert.equal(envelope.fps, 50);
  assert.equal(envelope.values.length, 100);
  assert.equal(voiceAt(envelope, 0.2, true), 0);
  assert.ok(voiceAt(envelope, 0.7, true) > 0.9);
  assert.equal(voiceAt(envelope, 1.5, true), 0);
  assert.equal(voiceAt(envelope, 0.7, false), 0);
  assert.equal(voiceAt(envelope, 10, true), 0);
  assert.equal(voiceAt(null, 0, true), 0);
  assert.equal(voiceAt(envelope, NaN, true), 0);
  assert.equal(voiceAt(envelope, -1, true), 0);
  assert.equal(voiceAt({ fps: 50, values: [0, 1] }, 0.01, true), 0.5);
  assert.throws(() => createEnvelope([], 0), /Invalid PCM/);
  assert.throws(() => createEnvelope([NaN], 24000), /Non-finite/);
  assert.ok(createEnvelope(new Float32Array(100), 1000).values.every(value => value === 0));
});

test('player reports missing audio and rejects stale playback work', async () => {
  const audio = new Element(), states = [];
  const player = createPlayer(audio, state => states.push(state));
  assert.equal(await player.play(null), false);
  assert.equal(states.at(-1), 'unavailable');
  for (const reject of [false, true]) {
    let settle;
    audio.play = () => new Promise((resolve, fail) => { settle = reject ? fail : resolve; });
    const pending = player.play('clip.wav');
    player.stop();
    audio.emit('ended');
    audio.emit('error');
    settle();
    assert.equal(await pending, false);
    assert.equal(states.at(-1), 'paused');
  }
  audio.play = () => Promise.reject(new Error('blocked'));
  assert.equal(await player.play('clip.wav'), false);
  assert.equal(states.at(-1), 'error');
});

function fixture(sceneFailure = false) {
  const elements = {};
  const document = new Element();
  document.getElementById = id => elements[id] || (elements[id] = new Element());
  document.createElement = document.createElementNS = () => new Element();
  const media = new Element();
  media.matches = true;
  const calls = [], timers = new Map();
  let timerId = 0;
  const scene = {
    setTopic: index => calls.push(['topic', index]),
    select: index => calls.push(['select', index]),
    act: () => calls.push(['act']),
    rotate: (...delta) => calls.push(['rotate', ...delta]),
    anchors: () => Array.from({ length: 8 }, () => ({ x: 540, y: 400 })),
    render: (...args) => calls.push(['render', ...args])
  };
  const replacements = {
    matchMedia: () => media,
    KioskUI: require('../js/kiosk-ui.js'),
    FrontDeskAudio: Object.fromEntries(Object.keys(content.clips()).map(key => [key, 'data:audio/wav;base64,test'])),
    FrontDeskEnvelopes: Object.fromEntries(Object.keys(content.clips()).map(key => [key, { fps: 50, values: [0, 1, 0] }])),
    FrontDeskScene: { create() { if (sceneFailure) throw new Error('No WebGL'); return scene; } },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: id => calls.push(['cancel', id]),
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
    performance: { now: () => 1000 }
  };
  const saved = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  return {
    elements, document, media, calls, timers, controller: mount(document),
    tick() { const callbacks = Array.from(timers.values()); timers.clear(); callbacks.forEach(callback => callback()); },
    restore() {
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  };
}

test('every topic, hotspot, question, action and handoff remains functional with short captions', async () => {
  const f = fixture(), e = f.elements;
  try {
    f.controller.enter();
    await Promise.resolve();
    assert.equal(e.fdAudio.paused, false);
    assert.equal(e.frontDesk.classes.has('is-speaking'), true);
    assert.equal(e.fdChapterNav.children.length, 5);
    for (let index = 0; index < 5; index++) {
      e.fdChapterNav.children[index].click();
      assert.equal(e.frontDesk.dataset.topic, content.topics[index].id);
      for (const button of e.fdHotspots.children) {
        button.click();
        assert.ok(e.fdTranscript.textContent.split(/\s+/).length <= 40);
        assert.equal(button.attributes['aria-pressed'], 'true');
      }
      e.fdAct.click();
    }
    assert.equal(e.fdProgress.textContent, 'Explored 29 / 29');
    assert.ok(f.calls.some(([type]) => type === 'act'));
    e.fdAsk.click();
    e.fdAsk.click();
    assert.equal(e.fdQuestions.hidden, true);
    for (const question of e.fdQuestionList.children) {
      e.fdAsk.click();
      question.click();
      assert.equal(e.fdQuestions.hidden, true);
    }
    e.fdAsk.click();
    e.fdCloseQuestions.click();
    assert.equal(e.fdAsk.focused, true);
    e.fdHandoff.click();
    e.fdRobotReady.click();
    assert.match(e.fdHandoffResult.textContent, /no robot command/);
    e.fdHandoff.click();
    e.fdHumanHost.click();
    assert.match(e.fdHandoffResult.textContent, /No automatic notification/);
    e.fdHandoff.click();
    e.fdHandoff.click();
    assert.equal(e.fdHandoffOptions.hidden, true);
    e.frontDesk.emit('keydown', { key: 'Escape' });
    e.frontDesk.emit('keydown', { key: 'Enter' });
    let prevented = false;
    e.fdChapterNav.emit('keydown', { key: 'Home', preventDefault() { prevented = true; } });
    e.fdChapterNav.emit('keydown', { key: 'Enter' });
    assert.ok(prevented);
    assert.equal(e.frontDesk.dataset.topic, 'welcome');
    e.fdAudio.duration = 10; e.fdAudio.currentTime = 5;
    e.fdAudio.emit('timeupdate');
    assert.equal(e.fdAudioProgress.value, 0.5);
    e.fdAudio.duration = NaN; e.fdAudio.emit('timeupdate');
    assert.equal(e.fdAudioProgress.value, 0);
    e.fdVoice.click();
    assert.equal(e.fdAudio.paused, true);
    e.fdHotspots.children[0].click();
    assert.equal(e.fdAudio.paused, true);
    e.fdVoice.click();
    await Promise.resolve();
    assert.equal(e.fdAudio.paused, false);
    e.fdCanvas.emit('pointermove', { pointerId: 1, clientX: 4, clientY: 4 });
    e.fdCanvas.emit('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 });
    e.fdCanvas.emit('pointermove', { pointerId: 2, clientX: 8, clientY: 4 });
    e.fdCanvas.emit('pointermove', { pointerId: 1, clientX: 8, clientY: 4 });
    assert.ok(f.calls.some(call => call[0] === 'rotate' && call[1] === 16 && call[2] === 8));
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) e.fdCanvas.emit(event);
    e.frontDesk.emit('pointerdown', { stopPropagation() {} });
    f.media.matches = false; f.media.emit('change');
    f.document.hidden = true; f.document.emit('visibilitychange');
    assert.equal(e.fdAudio.paused, true);
    f.document.hidden = false; f.document.emit('visibilitychange');
    assert.equal(e.fdVoice.textContent, 'Resume voice');
    e.fdVoice.click();
    await Promise.resolve();
    assert.equal(e.fdAudio.paused, false);
    f.controller.leave();
    assert.equal(e.frontDesk.hidden, true);
    assert.ok(f.calls.some(call => call[0] === 'cancel'));
    f.controller.enter();
    assert.equal(e.fdProgress.textContent, 'Explored 0 / 29');
    f.controller.leave();
  } finally { f.restore(); }
});

test('guided tour advances on real audio completion and stops on manual interaction, errors or leaving', async () => {
  const f = fixture(), e = f.elements;
  try {
    f.controller.enter();
    e.fdTour.click();
    for (let step = 0; step < 34; step++) {
      await Promise.resolve();
      e.fdAudio.emit('ended');
      assert.equal(f.timers.size, 1);
      f.tick();
    }
    assert.equal(e.fdTour.attributes['aria-pressed'], 'false');
    assert.equal(e.fdProgress.textContent, 'Explored 29 / 29');
    e.fdTour.click();
    e.fdTour.click();
    assert.equal(e.fdAudio.paused, true);
    e.fdTour.click();
    await Promise.resolve();
    e.fdAudio.emit('ended');
    e.fdAsk.click();
    assert.equal(f.timers.size, 0);
    e.fdTour.click();
    e.fdAudio.emit('error');
    assert.match(e.fdAudioStatus.textContent, /could not play/);
    assert.equal(e.fdTour.attributes['aria-pressed'], 'false');
    e.fdVoice.click();
    await Promise.resolve();
    assert.equal(e.fdVoice.textContent, 'Voice on');
    e.fdTour.click();
    f.controller.leave();
    assert.equal(e.fdAudio.paused, true);
    assert.equal(f.timers.size, 0);
  } finally { f.restore(); }
});

test('graphics failure is disclosed without disabling voice or accessible controls', t => {
  const f = fixture(true), e = f.elements;
  t.mock.method(console, 'error', () => {});
  try {
    f.controller.enter();
    assert.match(e.fdSceneStatus.textContent, /3D unavailable/);
    e.fdChapterNav.children[2].click();
    e.fdHotspots.children[0].click();
    e.fdAct.click();
    e.fdCanvas.emit('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 });
    e.fdCanvas.emit('pointermove', { pointerId: 1, clientX: 8, clientY: 4 });
    f.controller.leave();
  } finally { f.restore(); }
});
