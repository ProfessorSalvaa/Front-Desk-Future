(function (root) {
  'use strict';
  root.FrontDeskScene = {
    create: function (canvas) {
      var T = root.THREE;
      var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 1.5));
      renderer.setSize(1080, 1160, false);
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      var scene = new T.Scene();
      var camera = new T.PerspectiveCamera(40, 1080 / 1160, 0.1, 100);
      camera.position.set(0, 5.5, 13);
      camera.lookAt(0, 1.8, 0);
      scene.add(new T.HemisphereLight(0xe4faff, 0x17372b, 0.9));
      var light = new T.DirectionalLight(0xe8fff3, 1.5);
      light.position.set(2, 7, 5);
      scene.add(light);
      var fill = new T.PointLight(0x71e5cb, 1.6, 20);
      fill.position.set(-4, 4, 2);
      scene.add(fill);
      var world = new T.Group();
      scene.add(world);
      function material(color, metal, rough) {
        return new T.MeshStandardMaterial({ color: color, metalness: metal || 0, roughness: rough || 0.5 });
      }
      var stone = material(0x203b34, 0.25), brass = material(0x6dd4b1, 0.55, 0.25);
      var glow = new T.MeshStandardMaterial({ color: 0xabffe8, emissive: 0x45b394, emissiveIntensity: 0.65, metalness: 0.3, roughness: 0.25 });
      var porcelain = new T.MeshStandardMaterial({ color: 0xd1f5e9, emissive: 0x245949, emissiveIntensity: 0.25, metalness: 0.65, roughness: 0.24 });
      var floorMaterial = material(0x172b27, 0.3, 0.35);
      function mesh(geo, mat, parent, x, y, z) {
        var object = new T.Mesh(geo, mat);
        object.position.set(x || 0, y || 0, z || 0);
        parent.add(object);
        return object;
      }
      function box(parent, mat, x, y, z, w, h, d) {
        return mesh(new T.BoxGeometry(w, h, d), mat, parent, x, y, z);
      }
      function ring(parent, radius, y, color) {
        var object = mesh(new T.TorusGeometry(radius, 0.018, 8, 90), material(color, 0.5, 0.2), parent, 0, y, 0);
        object.rotation.x = Math.PI / 2;
        return object;
      }
      var floor = mesh(new T.CylinderGeometry(5.2, 5.4, 0.18, 80), floorMaterial, world, 0, -0.15, 0);
      var floorRing = ring(world, 4.9, -0.04, 0x647c70);
      var lobby = new T.Group();
      world.add(lobby);
      // Architectural fins give the lobby depth without obscuring the host.
      for (var n = 0; n < 15; n++) {
        var angle = Math.PI * 0.1 + n / 14 * Math.PI * 0.8;
        var fin = box(lobby, n % 3 === 0 ? brass : stone, Math.cos(angle) * 4.6, 1.65, -Math.sin(angle) * 4.6, 0.09, 3.5, 0.18);
        fin.rotation.y = -angle;
      }
      var desk = new T.Group();
      world.add(desk);
      box(desk, stone, 1.1, 0.65, -0.5, 3.4, 1.2, 0.95);
      box(desk, brass, 1.1, 1.29, -0.5, 3.65, 0.09, 1.16);
      box(desk, glow, 1.1, 0.15, 0, 3.1, 0.025, 0.025);
      for (var i = 0; i < 17; i++) box(desk, brass, -0.45 + i * 0.19, 0.69, -0.012, 0.018, 0.94, 0.025);
      var tablet = box(desk, stone, 1.8, 1.54, -0.52, 0.55, 0.42, 0.04);
      tablet.rotation.x = -0.3;
      [-3.6, 3.8].forEach(function (x) {
        mesh(new T.CylinderGeometry(0.28, 0.21, 0.65, 24), brass, lobby, x, 0.3, -1.7);
        for (var j = 0; j < 5; j++) {
          var leaf = mesh(new T.SphereGeometry(0.35, 12, 12), material(0x427e58), lobby, x + Math.sin(j * 2) * 0.24, 0.95 + j * 0.12, -1.7 + Math.cos(j * 2) * 0.2);
          leaf.scale.set(0.4, 1.8, 0.65);
          leaf.rotation.z = Math.sin(j * 2) * 0.5;
        }
      });
      var host = new T.Group();
      host.position.set(-1.5, 0, 0.7);
      world.add(host);
      var figure = new T.Group();
      figure.position.y = 1.65;
      host.add(figure);
      var orbMaterial = new T.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uVoice: { value: 0 }, uPulse: { value: 0 }, uLight: { value: 0 }, uChoice: { value: 0 } },
        vertexShader: [
          'uniform float uTime, uVoice, uPulse; varying vec3 vP; varying vec3 vN; varying vec3 vEye;',
          'void main(){',
          'vP=position;',
          'float wave=sin(position.y*8.0+uTime*1.1)*sin(position.x*7.0-uTime*0.8)*sin(position.z*6.0+uTime*0.6);',
          'vec3 p=position+normal*wave*(0.025+uVoice*0.085+uPulse*0.065);',
          'vec4 mv=modelViewMatrix*vec4(p,1.0);',
          'vN=normalize(normalMatrix*normal); vEye=normalize(-mv.xyz);',
          'gl_Position=projectionMatrix*mv; }'
        ].join('\n'),
        fragmentShader: [
          'uniform float uTime, uVoice, uPulse, uLight, uChoice; varying vec3 vP; varying vec3 vN; varying vec3 vEye;',
          'void main(){',
          'float f=pow(1.0-max(0.0,dot(normalize(vN),normalize(vEye))),2.6);',
          'float flow=sin(vP.y*13.0+sin(vP.x*7.0+uTime*0.6)*1.8+sin(vP.z*9.0-uTime*0.45));',
          'float filament=pow(0.5+0.5*flow,18.0);',
          'float weave=pow(0.5+0.5*sin(vP.x*24.0+vP.z*18.0+sin(vP.y*11.0-uTime)),28.0);',
          'vec3 deep=mix(vec3(0.008,0.055,0.055),vec3(0.04,0.18,0.13),uLight);',
          'vec3 mint=mix(vec3(0.22,0.94,0.74),vec3(0.05,0.48,0.3),uLight);',
          'vec3 blue=mix(vec3(0.14,0.52,0.86),vec3(0.03,0.28,0.43),uLight);',
          'vec3 col=deep+mint*(filament*(0.48+uVoice*0.7)+f*(0.85+uVoice*0.3))+blue*weave*0.32;',
          'col+=mint*uPulse*filament*0.3+blue*sin(uChoice)*0.06;',
          'if(uLight>0.5){',
          'float face=max(0.0,dot(normalize(vN),normalize(vec3(-0.5,0.7,1.0))));',
          'vec3 pearl=vec3(0.83,0.94,0.89)*(0.6+face*0.4);',
          'vec3 ribbon=mix(vec3(0.03,0.27,0.2),vec3(0.1,0.6,0.39),uVoice);',
          'col=mix(pearl,ribbon,filament*(0.65+uVoice*0.3));',
          'col=mix(col,vec3(0.08,0.36,0.26),f*0.68)+vec3(0.1,0.19,0.14)*weave;',
          '}',
          'gl_FragColor=vec4(col,1.0); }'
        ].join('\n')
      });
      var core = mesh(new T.SphereGeometry(0.92, 80, 64), orbMaterial, figure);
      var shell = mesh(new T.SphereGeometry(0.99, 48, 32), new T.MeshBasicMaterial({
        color: 0x7ee7c5, transparent: true, opacity: 0.07, wireframe: true, depthWrite: false
      }), figure);
      var aura = [], orbNodes = [];
      for (var a = 0; a < 5; a++) {
        var orbit = new T.Group();
        orbit.rotation.set(a * 0.65 + 0.2, a * 1.1, a * 0.9);
        figure.add(orbit);
        var arc = mesh(new T.TorusGeometry(1.12 + a * 0.055, 0.009, 6, 120, Math.PI * (1.1 + a * 0.12)), glow, orbit);
        var bead = mesh(new T.SphereGeometry(0.036 + a * 0.003, 12, 10), glow, orbit, 1.12 + a * 0.055, 0, 0);
        aura.push(orbit);
        orbNodes.push(bead);
        arc.userData.index = a;
      }
      var haloPositions = new Float32Array(600 * 3);
      for (var h = 0; h < 600; h++) {
        var y = 1 - h / 599 * 2, theta = h * 2.399963, radius = 1.05 + (Math.sin(h * 78.23) + 1) * 0.14;
        haloPositions[h * 3] = Math.cos(theta) * Math.sqrt(1 - y * y) * radius;
        haloPositions[h * 3 + 1] = y * radius;
        haloPositions[h * 3 + 2] = Math.sin(theta) * Math.sqrt(1 - y * y) * radius;
      }
      var haloGeo = new T.BufferGeometry();
      haloGeo.setAttribute('position', new T.BufferAttribute(haloPositions, 3));
      var haloMaterial = new T.PointsMaterial({ color: 0x96eacd, size: 0.018, transparent: true, opacity: 0.8 });
      var halo = new T.Points(haloGeo, haloMaterial);
      figure.add(halo);
      var signalRing = mesh(new T.TorusGeometry(1.44, 0.018, 8, 140), glow, figure);
      signalRing.rotation.x = 0.28;
      var signalBars = [];
      for (var b = 0; b < 64; b++) {
        var bar = box(figure, brass, 0, 0, 0, 0.015, 0.075, 0.018);
        bar.userData.angle = b / 64 * Math.PI * 2;
        signalBars.push(bar);
      }
      var shadowMaterial = new T.ShaderMaterial({
        uniforms: { uLight: { value: 0 } },
        transparent: true, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'varying vec2 vUv; uniform float uLight; void main(){float d=length((vUv-0.5)*2.0);float a=pow(max(0.0,1.0-d),2.2);gl_FragColor=vec4(mix(vec3(0.13,0.65,0.43),vec3(0.03,0.15,0.1),uLight),a*0.3);}'
      });
      var orbShadow = mesh(new T.PlaneGeometry(4.8, 3.4), shadowMaterial, world, 0, 0.02, 0);
      orbShadow.rotation.x = -Math.PI / 2;
      var queue = new T.Group();
      world.add(queue);
      for (var q = 0; q < 10; q++) {
        var person = new T.Group();
        person.position.set(0.1 + q % 2 * 0.6, 0, 1.15 + Math.floor(q / 2) * 0.55);
        mesh(new T.SphereGeometry(0.105, 12, 10), brass, person, 0, 0.95, 0);
        mesh(new T.CylinderGeometry(0.14, 0.18, 0.65, 12), stone, person, 0, 0.5, 0);
        box(person, brass, 0.22, 0.23, 0, 0.16, 0.36, 0.16);
        queue.add(person);
      }
      var stack = new T.Group(), layers = [];
      stack.position.set(1.45, 0.3, 0);
      world.add(stack);
      for (var l = 0; l < 8; l++) {
        var layerMaterial = material(l === 7 ? 0xc5ac78 : 0x4e9f8a, 0.45, 0.3);
        var layer = box(stack, layerMaterial, 0, 3.4 - l * 0.43, 0, 2.8, 0.17, 1.6);
        layer.userData.base = layer.position.y;
        var edges = new T.LineSegments(new T.EdgesGeometry(layer.geometry), new T.LineBasicMaterial({ color: 0xafffd9, transparent: true, opacity: 0.8 }));
        layer.add(edges);
        box(layer, glow, -1, 0.1, 0, 0.06, 0.035, 1.2);
        layers.push(layer);
      }
      var doorway = new T.Group();
      doorway.position.set(2.1, 0, -1);
      world.add(doorway);
      box(doorway, brass, -0.75, 1.65, 0, 0.08, 3.3, 0.12);
      box(doorway, brass, 0.75, 1.65, 0, 0.08, 3.3, 0.12);
      box(doorway, glow, 0, 3.3, 0, 1.58, 0.08, 0.12);
      var doorLeft = box(doorway, material(0x285745, 0.5, 0.2), -0.36, 1.6, 0, 0.69, 3.15, 0.05);
      var doorRight = box(doorway, material(0x285745, 0.5, 0.2), 0.36, 1.6, 0, 0.69, 3.15, 0.05);
      var route = new T.Group(), routeDots = [];
      world.add(route);
      for (var r = 0; r < 24; r++) {
        var dot = mesh(new T.SphereGeometry(0.045, 8, 8), glow, route, -3.4 + r * 0.28, 0.05, 2.4 - r * 0.07);
        routeDots.push(dot);
      }
      var services = new T.Group(), serviceNodes = [];
      world.add(services);
      for (var s = 0; s < 6; s++) {
        var node = new T.Group();
        node.position.set(Math.cos(s / 6 * Math.PI * 2) * 2.8, 2.7 + Math.sin(s / 6 * Math.PI * 2) * 1.4, -0.3);
        var halo = mesh(new T.TorusGeometry(0.38, 0.025, 10, 48), glow, node);
        var symbol = mesh(s % 2 ? new T.OctahedronGeometry(0.22, 0) : new T.BoxGeometry(0.32, 0.25, 0.1), porcelain, node);
        node.userData.symbol = symbol;
        node.userData.halo = halo;
        serviceNodes.push(node);
        services.add(node);
      }
      var rooms = new T.Group(), roomNodes = [];
      world.add(rooms);
      for (var rm = 0; rm < 8; rm++) {
        var room = box(rooms, material(0x316a58, 0.4), -2.8 + rm % 4 * 1.7, 0.5 + Math.floor(rm / 4) * 1.15, -2.6, 1.3, 0.8, 1.1);
        box(room, glow, 0, 0, 0.56, 0.7, 0.4, 0.02);
        roomNodes.push(room);
      }
      var guest = new T.Group();
      guest.name = 'guest-journey';
      mesh(new T.SphereGeometry(0.16, 16, 12), porcelain, guest, 0, 0.94, 0);
      mesh(new T.CylinderGeometry(0.17, 0.23, 0.65, 16), glow, guest, 0, 0.45, 0);
      box(guest, brass, 0.28, 0.22, 0, 0.22, 0.4, 0.2);
      world.add(guest);
      var dustPositions = new Float32Array(360 * 3);
      for (var p = 0; p < 360; p++) {
        dustPositions[p * 3] = Math.sin(p * 12.9898) * 4.8;
        dustPositions[p * 3 + 1] = (Math.sin(p * 4.1414) + 1) * 3;
        dustPositions[p * 3 + 2] = Math.cos(p * 9.233) * 3;
      }
      var dustGeo = new T.BufferGeometry();
      dustGeo.setAttribute('position', new T.BufferAttribute(dustPositions, 3));
      var dustMaterial = new T.PointsMaterial({ color: 0x9be9ce, size: 0.025, transparent: true, opacity: 0.65 });
      var dust = new T.Points(dustGeo, dustMaterial);
      world.add(dust);
      var pulse = ring(world, 1, 0.04, 0x9ceccd);
      var signals = new T.Group(), signalDots = [];
      world.add(signals);
      for (var sd = 0; sd < 28; sd++) signalDots.push(mesh(new T.SphereGeometry(0.045, 8, 8), glow, signals));
      var chosen = -1, topic = 0, lastTime = 0, effectStart = -20, transitionStart = -20;
      var yaw = 0, pitch = 0, action = false, journeyPosition = 0;
      function setTopic(index) {
        topic = index;
        chosen = -1;
        yaw = 0; pitch = 0;
        transitionStart = lastTime;
        effectStart = lastTime;
        action = true;
        journeyPosition = 0;
        queue.visible = false;
        host.visible = index !== 2;
        host.position.set(index === 0 ? 0 : -1.75, 0, index === 0 ? 0 : 0.7);
        host.scale.setScalar(index === 0 ? 1.8 : index === 4 ? 1.05 : 0.7);
        desk.visible = index === 1 || index === 3;
        lobby.visible = index === 1;
        stack.visible = index === 2;
        stack.position.set(0, 0.2, 0);
        stack.scale.setScalar(1.2);
        doorway.visible = index === 4;
        doorway.scale.setScalar(1.4);
        doorway.position.set(1, 0, -0.4);
        route.visible = index === 3 || index === 4;
        rooms.visible = index === 3;
        guest.visible = index === 3;
        services.visible = index === 1;
        floor.scale.setScalar(index === 1 || index === 3 ? 0.85 : 0.65);
        floor.visible = index !== 0;
        floorRing.visible = index !== 0;
        floorRing.scale.copy(floor.scale);
        orbShadow.visible = index === 0;
      }
      function render(time, voiceLevel, reduced) {
        var dt = reduced ? 0 : Math.max(0, Math.min(0.1, time - lastTime));
        lastTime = time;
        var voice = reduced ? 0 : Math.max(0, Math.min(1, voiceLevel));
        var elapsed = reduced ? 20 : Math.max(0, time - effectStart);
        var entrance = reduced ? 1 : Math.min(1, Math.max(0, time - transitionStart) / 1.25);
        var build = 1 - Math.pow(1 - entrance, 3);
        var proto = document.body.classList.contains('proto');
        floorMaterial.color.setHex(proto ? 0xbacbc2 : 0x10251e);
        stone.color.setHex(proto ? 0x527361 : 0x173f31);
        porcelain.color.setHex(proto ? 0x608b76 : 0xd1f5e9);
        brass.color.setHex(proto ? 0x376e50 : 0x6dd4b1);
        glow.color.setHex(proto ? 0x348563 : 0xabffe8);
        shadowMaterial.uniforms.uLight.value = proto ? 1 : 0;
        dustMaterial.color.setHex(proto ? 0x276844 : 0x9be9ce);
        world.rotation.y = yaw + (topic === 2 ? -0.35 : 0) + Math.sin(time * 0.18) * 0.15 + (1 - build) * 0.42;
        world.rotation.x = pitch;
        world.scale.setScalar(0.75 + build * 0.25);
        world.position.y = (1 - build) * -0.4;
        figure.position.y = 1.65 + Math.sin(time * 0.8) * 0.055;
        figure.rotation.y = time * 0.1;
        var reveal = action && topic === 0 ? Math.min(1, 0.2 + elapsed / 1.4) : 1;
        figure.scale.setScalar(reveal * (1 + voice * 0.11));
        orbMaterial.uniforms.uTime.value = time;
        orbMaterial.uniforms.uVoice.value = voice;
        orbMaterial.uniforms.uPulse.value = Math.max(0, 1 - elapsed / 2);
        orbMaterial.uniforms.uLight.value = proto ? 1 : 0;
        orbMaterial.uniforms.uChoice.value = chosen + 1;
        haloMaterial.color.setHex(proto ? 0x196044 : 0x96eacd);
        shell.material.color.setHex(proto ? 0x17583b : 0x7ee7c5);
        halo.rotation.y = -time * 0.08;
        halo.scale.setScalar(1 + voice * 0.16);
        haloMaterial.size = 0.018 + voice * 0.022;
        signalRing.scale.setScalar(1 + voice * 0.12);
        signalBars.forEach(function (bar, index) {
          var angle = bar.userData.angle, radius = 1.49 + voice * 0.16;
          bar.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.02);
          bar.rotation.z = angle - Math.PI / 2;
          bar.scale.y = 0.35 + voice * (1.5 + Math.sin(index * 2.4) * 0.7);
        });
        orbShadow.scale.setScalar(1 + voice * 0.08);
        shell.rotation.y = -time * 0.04;
        glow.emissiveIntensity = proto ? 0.04 + voice * 0.15 : 0.4 + voice * 0.6;
        aura.forEach(function (object, index) {
          object.rotation.z = time * (0.13 + index * 0.035) + index;
          object.rotation.y = time * 0.08 + index;
          object.scale.setScalar((index === chosen && topic === 0 ? 1.18 : 1) + voice * 0.06);
        });
        layers.forEach(function (layer, index) {
          var targetX = index === chosen ? -0.8 : 0;
          layer.position.x += (targetX - layer.position.x) * (reduced ? 1 : Math.min(1, dt * 7));
          var progress = action ? Math.max(0, Math.min(1, (elapsed - (7 - index) * 0.22) / 0.7)) : 1;
          layer.position.y = layer.userData.base * progress + Math.sin(time * 0.7 + index * 0.35) * 0.055;
          layer.rotation.y = index === chosen ? Math.sin(time * 0.8) * 0.07 : 0;
          layer.scale.setScalar(action ? 0.3 + progress * 0.7 : index === chosen ? 1.12 : 1);
          layer.material.color.setHex(index === chosen ? 0xb6f378 : index === 7 ? 0x86bc25 : proto ? 0x28745e : 0x3c8b70);
        });
        routeDots.forEach(function (dot, index) {
          dot.scale.setScalar(0.7 + (Math.sin(time * 2 - index * 0.3) + 1) * 0.5);
        });
        serviceNodes.forEach(function (node, index) {
          node.userData.symbol.rotation.y = time * 0.5 + index;
          node.userData.halo.rotation.z = time * 0.2;
          var revealNode = reduced ? 1 : Math.max(0.15, Math.min(1, (time - transitionStart - index * 0.12) * 2));
          node.scale.setScalar(revealNode * (index === chosen ? 1.45 : 1 + Math.sin(time + index) * 0.08));
          node.position.y = 2.7 + Math.sin(index / 6 * Math.PI * 2) * 1.4 + Math.sin(time * 0.7 + index) * 0.12;
        });
        queue.visible = topic === 0 && chosen === 1 || topic === 1 && action && elapsed < 3;
        queue.children.forEach(function (person, index) { person.position.x = 0.1 + index % 2 * 0.6 + (topic === 1 ? Math.min(elapsed, 3) * 1.5 : 0); });
        var journey = action && topic === 3 ? Math.min(1, elapsed / 9) : Math.max(0, chosen) / 4;
        journeyPosition += (journey - journeyPosition) * (reduced ? 1 : Math.min(1, dt * 3));
        guest.position.set(-3.4 + journeyPosition * 6.4, reduced ? 0 : Math.sin(time * 8) * 0.025, 2.4 - journeyPosition * 1.6);
        roomNodes.forEach(function (room, index) {
          var roomBuild = reduced ? 1 : Math.max(0.05, Math.min(1, (time - transitionStart - index * 0.09) * 1.4));
          room.scale.y = roomBuild * (topic === 3 && chosen === 1 && index === 2 ? 1.35 : 1);
          room.material.color.setHex(index === Math.min(7, Math.floor(journeyPosition * 8)) ? (proto ? 0x5c9850 : 0x86bc25) : (proto ? 0x709d89 : 0x316a58));
        });
        signals.visible = topic === 1 || topic === 2 || topic === 3;
        signalDots.forEach(function (dot, index) {
          var u = reduced ? index / signalDots.length : (time * 0.22 + index / signalDots.length) % 1;
          if (topic === 2) {
            dot.position.set(Math.cos(u * Math.PI * 4) * 1.85, u * 4.3, Math.sin(u * Math.PI * 4) * 1.2);
          } else if (topic === 1) {
            var target = serviceNodes[chosen >= 0 ? chosen : index % serviceNodes.length].position;
            dot.position.set(-1.75 + (target.x + 1.75) * u, 1.15 + (target.y - 1.15) * u + Math.sin(u * Math.PI) * 0.55, target.z * u);
          } else {
            dot.position.set(-3.4 + u * 6.4, 0.12, 2.4 - u * 1.6);
          }
          dot.scale.setScalar(0.7 + voice * 0.8);
        });
        var opening = topic === 4 ? Math.min(1, elapsed / 2) : 0;
        doorLeft.position.x = -0.36 - opening * 0.62;
        doorRight.position.x = 0.36 + opening * 0.62;
        pulse.visible = elapsed < 3 && !reduced;
        pulse.scale.setScalar(0.2 + elapsed * 1.5);
        dust.rotation.y = time * 0.03;
        dust.position.y = Math.sin(time * 0.3) * 0.15;
        renderer.render(scene, camera);
      }
      var point = new T.Vector3();
      function anchors() {
        var targets = topic === 0 ? orbNodes
          : topic === 1 ? serviceNodes
          : topic === 2 ? layers
          : topic === 3 ? [routeDots[0], roomNodes[2], core, routeDots[20], guest]
          : [doorLeft, doorRight, core, orbNodes[0], doorway];
        return targets.map(function (target) {
          target.getWorldPosition(point);
          point.project(camera);
          return { x: (point.x + 1) * 540, y: (1 - point.y) * 580 };
        });
      }
      return {
        setTopic: setTopic,
        select: function (index) { chosen = index; action = false; effectStart = lastTime; },
        act: function () { action = true; effectStart = lastTime; },
        rotate: function (dx, dy) { yaw += dx * 0.006; pitch = Math.max(-0.25, Math.min(0.25, pitch + dy * 0.003)); },
        anchors: anchors,
        render: render
      };
    }
  };
})(window);
