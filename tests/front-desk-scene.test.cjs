const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

test('orb, topic actions, projected hotspots and drag transforms render without per-frame scene allocation', () => {
  const objects = [], frames = [];
  class Vector {
    constructor() { this.set(0, 0, 0); }
    set(x, y, z) { Object.assign(this, { x, y, z }); return this; }
    setScalar(value) { return this.set(value, value, value); }
    copy(other) { return this.set(other.x, other.y, other.z); }
    project() { return this; }
  }
  class Object3D {
    constructor() {
      this.children = []; this.userData = {};
      this.position = new Vector(); this.rotation = new Vector(); this.scale = new Vector();
      objects.push(this);
    }
    add(...children) { this.children.push(...children); }
    lookAt() {}
    getWorldPosition(point) { point.copy(this.position); }
  }
  class Material {
    constructor(options) { Object.assign(this, options); this.color = { setHex(value) { this.value = value; } }; }
  }
  class Mesh extends Object3D {
    constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
  }
  class Renderer {
    setPixelRatio() {}
    setSize(w, h) { assert.equal(w / h, 1080 / 1160); }
    render(scene, camera) { frames.push({ scene, camera }); }
  }
  const THREE = {
    WebGLRenderer: Renderer, Scene: Object3D, PerspectiveCamera: Object3D,
    HemisphereLight: Object3D, DirectionalLight: Object3D, PointLight: Object3D,
    Group: Object3D, MeshStandardMaterial: Material, MeshBasicMaterial: Material,
    PointsMaterial: Material, LineBasicMaterial: Material, ShaderMaterial: Material,
    Mesh, Points: Mesh, LineSegments: Mesh, Vector3: Vector,
    BufferGeometry: class { setAttribute() {} }, BufferAttribute: class {},
    sRGBEncoding: 3001, ACESFilmicToneMapping: 4
  };
  for (const name of ['BoxGeometry', 'TorusGeometry', 'CylinderGeometry', 'SphereGeometry', 'OctahedronGeometry', 'EdgesGeometry', 'PlaneGeometry']) THREE[name] = class {};
  let proto = false;
  const window = { THREE, devicePixelRatio: 2 };
  const file = resolve(__dirname, '../js/front-desk-scene.js');
  runInNewContext(readFileSync(file, 'utf8'), {
    window, document: { body: { classList: { contains: () => proto } } }
  }, { filename: file });
  const scene = window.FrontDeskScene.create({});
  const count = objects.length;
  const shader = objects.find(object => object.material?.uniforms?.uVoice)?.material;
  assert.ok(shader, 'Ava is a procedural 3D orb');
  scene.setTopic(0);
  scene.render(1, 0, false);
  assert.equal(shader.uniforms.uVoice.value, 0);
  scene.render(1, 0.85, false);
  assert.equal(shader.uniforms.uVoice.value, 0.85, 'motion follows actual audio energy, not wall-clock sine');
  scene.render(1, 0, false);
  assert.equal(shader.uniforms.uVoice.value, 0, 'voice motion stops in silence');
  const layers = objects.filter(object => object.userData.base !== undefined);
  scene.setTopic(2);
  scene.render(1, 0, false);
  const folded = layers[0].position.y;
  scene.render(4, 0, false);
  assert.ok(layers[0].position.y - folded > 3, 'architecture assembles on topic entry');
  scene.select(0);
  scene.render(4.1, 0, false);
  assert.ok(layers[0].position.x < 0 && layers[0].position.x > -0.8, 'selection slides a layer out rather than teleporting');
  const guest = objects.find(object => object.name === 'guest-journey');
  scene.setTopic(3);
  scene.render(4.1, 0, false);
  const arrival = guest.position.x;
  scene.render(8, 0, false);
  assert.ok(guest.position.x > arrival, 'guest arrival advances automatically');
  for (const theme of [false, true]) {
    proto = theme;
    for (let topic = 0; topic < 5; topic++) {
      scene.setTopic(topic);
      const anchors = scene.anchors();
      assert.equal(anchors.length, [5, 6, 8, 5, 5][topic]);
      assert.ok(anchors.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
      for (let selected = 0; selected < anchors.length; selected++) {
        scene.select(selected);
        scene.render(1, 0, false);
        scene.render(2, 0.8, false);
      }
      scene.act();
      for (const time of [2, 2.5, 3, 5, 12]) scene.render(time, 0.6, false);
      scene.render(0, 0, true);
      scene.rotate(40, 900);
      scene.rotate(-20, -900);
      scene.render(0, 1, true);
      assert.equal(shader.uniforms.uVoice.value, 0, 'reduced motion suppresses voice deformation');
    }
  }
  assert.equal(objects.length, count);
  assert.ok(frames.length > 100);
});
