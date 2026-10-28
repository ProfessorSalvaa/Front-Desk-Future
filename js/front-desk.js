(function (root) {
  'use strict';
  var C = typeof module !== 'undefined' && module.exports ? require('./front-desk-content.js') : root.FrontDeskContent;

  function chooseVariant(count, previous, random) {
    if (count < 2) return 0;
    var valid = Number.isInteger(previous) && previous >= 0 && previous < count;
    var selected = Math.floor(random() * (count - (valid ? 1 : 0)));
    return valid && selected >= previous ? selected + 1 : selected;
  }

  function tourSteps(topics) {
    return topics.flatMap(function (topic, index) {
      return [{ topic: index, hotspot: -1 }].concat(topic.hotspots.map(function (_, n) { return { topic: index, hotspot: n }; }));
    });
  }

  function createEnvelope(samples, sampleRate) {
    if (!samples.length || !Number.isFinite(sampleRate) || sampleRate < 50) throw new Error('Invalid PCM envelope input');
    var frameSize = Math.round(sampleRate / 50), energy = [];
    for (var start = 0; start < samples.length; start += frameSize) {
      var end = Math.min(samples.length, start + frameSize), sum = 0;
      for (var n = start; n < end; n++) {
        if (!Number.isFinite(samples[n])) throw new Error('Non-finite PCM sample');
        sum += samples[n] * samples[n];
      }
      energy.push(Math.sqrt(sum / (end - start)));
    }
    var reference = Math.max(0.02, Math.max.apply(null, energy));
    return {
      fps: sampleRate / frameSize,
      values: energy.map(function (rms) { return Math.round(Math.sqrt(Math.max(0, (rms - 0.006) / (reference - 0.006))) * 1000) / 1000; })
    };
  }

  function voiceAt(envelope, seconds, playing) {
    if (!playing || !envelope || !Number.isFinite(seconds) || seconds < 0) return 0;
    var position = seconds * envelope.fps, index = Math.floor(position);
    if (index >= envelope.values.length) return 0;
    var next = index + 1 < envelope.values.length ? envelope.values[index + 1] : 0;
    return envelope.values[index] + (next - envelope.values[index]) * (position - index);
  }

  function createPlayer(audio, notify) {
    var revision = 0, enabled = false;
    audio.addEventListener('ended', function () { if (enabled) { enabled = false; notify('ended'); } });
    audio.addEventListener('error', function () {
      if (!enabled) return;
      enabled = false;
      revision++;
      audio.pause();
      notify('error');
    });
    return {
      stop: function () { revision++; enabled = false; audio.pause(); notify('paused'); },
      play: async function (src) {
        var token = ++revision;
        enabled = false;
        audio.pause();
        if (!src) { notify('unavailable'); return false; }
        audio.src = src;
        audio.currentTime = 0;
        enabled = true;
        try {
          await audio.play();
          if (revision !== token) return false;
          notify('playing');
          return true;
        } catch (error) {
          if (revision === token) { enabled = false; notify('error'); }
          return false;
        }
      }
    };
  }

  function mount(document) {
    var $ = function (id) { return document.getElementById(id); };
    var screen = $('frontDesk'), audio = $('fdAudio'), canvas = $('fdCanvas');
    var active = false, scene = null, topic = 0, selected = -1, previousOpening = null;
    var frame = 0, playing = false, voiceOn = true, clip = null, envelope = null, visited = new Set();
    var touring = false, tourTimer = null, currentStep = 0, steps = tourSteps(C.topics);
    var reduced = root.matchMedia('(prefers-reduced-motion: reduce)');
    var drag = null, hotspotButtons = [], connectorLines = [];
    var total = C.topics.reduce(function (sum, item) { return sum + item.hotspots.length; }, 0);

    function stopTour() {
      touring = false;
      if (tourTimer !== null) root.clearTimeout(tourTimer);
      tourTimer = null;
      $('fdTour').setAttribute('aria-pressed', 'false');
      $('fdTour').textContent = 'Guided tour';
    }
    var player = createPlayer(audio, function (state) {
      playing = state === 'playing';
      screen.classList.toggle('is-speaking', playing);
      if (!playing) screen.style.setProperty('--fd-voice', '0');
      $('fdAudioStatus').textContent = {
        playing: '', paused: '', unavailable: 'Voice unavailable. Please choose another topic.',
        ended: '', error: 'Voice could not play. Tap Voice to retry.'
      }[state];
      if (state === 'error' || state === 'unavailable') {
        stopTour();
        $('fdVoice').setAttribute('aria-pressed', 'false');
        $('fdVoice').textContent = 'Retry voice';
      }
      if (state === 'ended' && touring) {
        tourTimer = root.setTimeout(function () {
          tourTimer = null;
          if (!touring || !active || document.hidden) return;
          currentStep++;
          if (currentStep === steps.length) { stopTour(); return; }
          playStep();
        }, 950);
      }
    });

    function element(tag, className, text) {
      var el = document.createElement(tag);
      if (className) el.className = className;
      if (text) el.textContent = text;
      return el;
    }
    function speak(title, text, key) {
      player.stop();
      clip = key ? (root.FrontDeskAudio && root.FrontDeskAudio[key] || 'audio/front-desk/' + key + '.wav') : null;
      envelope = root.FrontDeskEnvelopes && root.FrontDeskEnvelopes[key];
      if (!envelope) {
        console.error('Front desk voice envelope missing for ' + key);
        $('fdSceneStatus').textContent = 'Voice-synced motion is unavailable. Rebuild the narration bundle.';
      }
      $('fdSpeaker').textContent = title;
      $('fdTranscript').textContent = text;
      $('fdAudioProgress').value = 0;
      $('fdVoice').setAttribute('aria-pressed', String(voiceOn));
      $('fdVoice').textContent = voiceOn ? 'Voice on' : 'Voice off';
      if (voiceOn && active && !document.hidden) player.play(clip);
      refresh();
    }
    function closePanels() {
      $('fdQuestions').hidden = true;
      $('fdHandoffOptions').hidden = true;
      $('fdHandoffResult').textContent = '';
      $('fdAsk').setAttribute('aria-expanded', 'false');
    }
    function select(index, manual) {
      if (manual) stopTour();
      selected = index;
      var item = C.topics[topic].hotspots[index];
      visited.add(topic + ':' + index);
      $('fdProgress').textContent = 'Explored ' + visited.size + ' / ' + total;
      hotspotButtons.forEach(function (button, n) {
        button.setAttribute('aria-pressed', String(n === index));
        button.classList.toggle('seen', visited.has(topic + ':' + n));
      });
      if (scene) scene.select(index);
      closePanels();
      speak(item.title, item.text, C.topics[topic].id + '-' + item.id);
      if (manual && topic === 4 && index === 3) openQuestions();
      if (manual && topic === 4 && index === 4) $('fdHandoffOptions').hidden = false;
    }
    function setTopic(index, manual) {
      if (!Number.isInteger(index) || index < 0 || index >= C.topics.length) throw new RangeError('Unknown front-desk topic');
      if (manual) stopTour();
      topic = index;
      selected = -1;
      var item = C.topics[index];
      screen.dataset.topic = item.id;
      $('fdChapter').textContent = '0' + (index + 1) + ' / 05';
      $('fdTitle').textContent = item.name;
      $('fdCue').textContent = item.tagline;
      $('fdAct').textContent = item.action;
      $('fdHandoff').hidden = index !== 4;
      $('fdChapterNav').querySelectorAll('button').forEach(function (button, n) {
        button.setAttribute('aria-selected', String(n === index));
        button.tabIndex = n === index ? 0 : -1;
      });
      closePanels();
      $('fdHotspots').replaceChildren();
      $('fdConnections').replaceChildren();
      hotspotButtons = [];
      connectorLines = [];
      item.hotspots.forEach(function (hotspot, n) {
        var side = n % 2, row = Math.floor(n / 2);
        var button = element('button', 'fd-spot' + (side ? ' right' : ''), '');
        button.type = 'button';
        button.style.top = (140 + row * (item.hotspots.length > 6 ? 215 : 270)) + 'px';
        button.setAttribute('aria-pressed', 'false');
        button.classList.toggle('seen', visited.has(index + ':' + n));
        button.appendChild(element('i', '', ''));
        button.appendChild(element('span', '', hotspot.title));
        button.addEventListener('click', function () { select(n, true); });
        $('fdHotspots').appendChild(button);
        hotspotButtons.push(button);
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        $('fdConnections').appendChild(line);
        connectorLines.push(line);
      });
      if (scene) scene.setTopic(index);
      var key = item.id + '-intro', text = item.intro;
      if (index === 0) {
        previousOpening = chooseVariant(C.openings.length, previousOpening, Math.random);
        key = 'opening-' + previousOpening;
        text = C.openings[previousOpening];
      }
      speak('Ava / ' + item.tab, text, key);
    }
    function playStep() {
      var step = steps[currentStep];
      if (step.hotspot === -1) setTopic(step.topic, false);
      else select(step.hotspot, false);
    }
    function openQuestions() {
      stopTour();
      $('fdQuestions').hidden = false;
      $('fdHandoffOptions').hidden = true;
      $('fdAsk').setAttribute('aria-expanded', 'true');
      $('fdQuestionList').children[0].focus();
    }

    C.topics.forEach(function (item, index) {
      var button = element('button', '', item.tab);
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.addEventListener('click', function () { setTopic(index, true); });
      $('fdChapterNav').appendChild(button);
    });
    $('fdChapterNav').addEventListener('keydown', function (event) {
      var next = root.KioskUI.nextTab(event.key, topic, C.topics.length);
      if (next === null) return;
      event.preventDefault();
      setTopic(next, true);
      this.children[next].focus();
    });
    $('fdVoice').addEventListener('click', function () {
      if (this.textContent === 'Retry voice' || this.textContent === 'Resume voice') voiceOn = true;
      else voiceOn = !voiceOn;
      stopTour();
      this.setAttribute('aria-pressed', String(voiceOn));
      this.textContent = voiceOn ? 'Voice on' : 'Voice off';
      if (voiceOn) player.play(clip);
      else player.stop();
    });
    $('fdTour').addEventListener('click', function () {
      if (touring) { stopTour(); player.stop(); return; }
      touring = true;
      voiceOn = true;
      currentStep = steps.findIndex(function (step) { return step.topic === topic && step.hotspot === selected; });
      this.setAttribute('aria-pressed', 'true');
      this.textContent = 'Stop tour';
      closePanels();
      playStep();
    });
    $('fdAct').addEventListener('click', function () {
      stopTour();
      closePanels();
      if (topic === 4) { select(0, true); return; }
      if (scene) scene.act();
      var item = C.topics[topic];
      speak(item.action, item.actionText, item.actionClip);
    });
    $('fdAsk').addEventListener('click', function () {
      if ($('fdQuestions').hidden) openQuestions();
      else closePanels();
    });
    $('fdCloseQuestions').addEventListener('click', function () { closePanels(); $('fdAsk').focus(); });
    C.questions.forEach(function (question) {
      var button = element('button', '', question.title);
      button.type = 'button';
      button.addEventListener('click', function () {
        closePanels();
        speak(question.title, question.text, 'question-' + question.id);
        $('fdAsk').focus();
      });
      $('fdQuestionList').appendChild(button);
    });
    $('fdHandoff').addEventListener('click', function () {
      stopTour();
      $('fdQuestions').hidden = true;
      $('fdHandoffOptions').hidden = !$('fdHandoffOptions').hidden;
    });
    $('fdRobotReady').addEventListener('click', function () {
      player.stop();
      $('fdHandoffOptions').hidden = true;
      $('fdHandoffResult').textContent = 'Follow your host. Readiness confirmed by the operator; no robot command was sent.';
    });
    $('fdHumanHost').addEventListener('click', function () {
      player.stop();
      $('fdHandoffOptions').hidden = true;
      $('fdHandoffResult').textContent = 'Please invite your human host to lead the experience. No automatic notification was sent.';
    });
    screen.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { closePanels(); $('fdAsk').focus(); }
    });
    audio.addEventListener('timeupdate', function () {
      $('fdAudioProgress').value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
    });
    screen.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
    canvas.addEventListener('pointerdown', function (event) {
      stopTour();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!drag || drag.id !== event.pointerId || !scene) return;
      var scale = canvas.getBoundingClientRect().width / 1080;
      scene.rotate((event.clientX - drag.x) / scale, (event.clientY - drag.y) / scale);
      drag.x = event.clientX; drag.y = event.clientY;
      refresh();
    });
    function release() { drag = null; }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture', release);

    function draw(time) {
      frame = 0;
      if (!active || document.hidden || !scene) return;
      var level = reduced.matches ? 0 : voiceAt(envelope, audio.currentTime, playing && !audio.paused);
      screen.style.setProperty('--fd-voice', level.toFixed(3));
      scene.render(reduced.matches ? 0 : time / 1000, level, reduced.matches);
      var points = scene.anchors();
      connectorLines.forEach(function (line, n) {
        var startX = n % 2 ? 996 : 84;
        var startY = 140 + Math.floor(n / 2) * (hotspotButtons.length > 6 ? 215 : 270) + 44;
        var point = points[n];
        line.setAttribute('d', point ? 'M' + startX + ' ' + startY + ' Q540 ' + startY + ' ' + point.x.toFixed(1) + ' ' + point.y.toFixed(1) : '');
        line.classList.toggle('selected', n === selected);
      });
      if (!reduced.matches) frame = root.requestAnimationFrame(draw);
    }
    function refresh() {
      if (frame) root.cancelAnimationFrame(frame);
      frame = 0;
      if (active && !document.hidden) draw(performance.now());
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopTour();
        player.stop();
        if (active && voiceOn) {
          $('fdVoice').textContent = 'Resume voice';
          $('fdVoice').setAttribute('aria-pressed', 'false');
          $('fdAudioStatus').textContent = 'Narration paused while away. Tap Resume voice to continue.';
        }
      }
      refresh();
    });
    reduced.addEventListener('change', refresh);
    return {
      enter: function () {
        active = true;
        screen.hidden = false;
        visited.clear();
        $('fdProgress').textContent = 'Explored 0 / ' + total;
        if (!scene) {
          try { scene = root.FrontDeskScene.create(canvas); }
          catch (error) {
            $('fdSceneStatus').textContent = '3D unavailable on this device. Hotspots and voice remain available.';
            console.error('Front desk 3D initialization failed', error);
          }
        }
        setTopic(0, false);
        refresh();
      },
      leave: function () {
        active = false;
        stopTour();
        player.stop();
        drag = null;
        if (frame) root.cancelAnimationFrame(frame);
        frame = 0;
        screen.hidden = true;
      }
    };
  }
  var api = { chooseVariant: chooseVariant, tourSteps: tourSteps, createEnvelope: createEnvelope, voiceAt: voiceAt, createPlayer: createPlayer, mount: mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FrontDesk = api;
})(typeof window !== 'undefined' ? window : globalThis);
