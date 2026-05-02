import * as THREE from 'three';
import { ContentTablet } from './ContentTablet.js';
import { RegionScene } from './RegionScene.js';

const regionPalettes = [
  { fog: 0x10140d, primary: 0xc9a84c, accent: 0x4e8c7a, ground: 0x10140d },
  { fog: 0x160f09, primary: 0xf0d060, accent: 0x8c4f32, ground: 0x1f140b },
  { fog: 0x071014, primary: 0xc9a84c, accent: 0x5f83a8, ground: 0x0b171c },
  { fog: 0x100b14, primary: 0xd7b661, accent: 0x7c5ca8, ground: 0x150f1c },
  { fog: 0x120e08, primary: 0xf0d060, accent: 0x9a6d35, ground: 0x191108 },
];

const regionContent = {
  About: {
    title: 'Isaac Hu',
    body: [
      'A builder drawn to strange maps, elegant systems, and interfaces that feel quietly alive.',
      'This portfolio is a small kingdom of experiments: code, craft, product instincts, and a stubborn fondness for making digital places feel inhabitable.',
    ].join('\n\n'),
    metadata: 'The Tarnished',
  },
  Projects: {
    title: 'Projects',
    body: 'A record of forged works: prototypes, product surfaces, strange mechanisms, and polished systems shaped from problem statements into working artifacts.',
    metadata: 'Sites of Great Runes',
  },
  Skills: {
    title: 'Skills',
    body: 'Tools and disciplines kept close at hand: frontend craft, interaction design, data modeling, visual systems, automation, and the patient work of making rough ideas legible.',
    metadata: 'The Golden Order',
  },
  Contact: {
    title: 'Contact',
    body: 'A resting place for messages, collaborations, questions, and new paths through the fog. Send word when the next quest marker appears.',
    metadata: 'Roundtable Hold',
  },
  Experience: {
    title: 'Experience',
    body: 'Past campaigns, lessons, and earned scars: teams joined, systems shipped, constraints navigated, and judgment sharpened across real projects.',
    metadata: 'The Long March',
  },
};

export function createRegionScenes(regions) {
  return regions.map((region, index) => {
    const SceneClass = getSceneClass(index);
    const scene = new SceneClass(region, regionPalettes[index] ?? regionPalettes[0]);
    scene.init();
    return scene;
  });
}

class GraceRegionScene extends RegionScene {
  group = new THREE.Group();
  particles = new THREE.Group();
  core = null;
  ring = null;
  graceLight = null;

  init() {
    this.scene.fog = new THREE.FogExp2(this.palette.fog, 0.055);
    this.scene.add(this.group);
    this.addLighting();
    this.addGround();
    this.addHeroObject();
    this.addParticles();
    this.addContent();
  }

  addLighting() {
    const ambient = new THREE.HemisphereLight(0xf8ddb0, this.palette.fog, 1.2);
    this.scene.add(ambient);

    this.graceLight = new THREE.PointLight(this.palette.primary, 12, 12);
    this.graceLight.position.set(0, 1.8, 1.2);
    this.scene.add(this.graceLight);

    const sideLight = new THREE.DirectionalLight(this.palette.accent, 1.8);
    sideLight.position.set(-3, 3, 4);
    this.scene.add(sideLight);
  }

  addGround() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 80),
      new THREE.MeshStandardMaterial({
        color: this.palette.ground,
        roughness: 0.9,
        metalness: 0.05,
        transparent: true,
        opacity: 0.78,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.05;
    this.group.add(ground);
  }

  addHeroObject() {
    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 2),
      new THREE.MeshStandardMaterial({
        color: this.palette.primary,
        emissive: this.palette.primary,
        emissiveIntensity: 0.72,
        roughness: 0.45,
        metalness: 0.18,
      })
    );
    this.core.position.y = 0.15;
    this.group.add(this.core);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.018, 12, 96),
      new THREE.MeshBasicMaterial({
        color: this.palette.primary,
        transparent: true,
        opacity: 0.7,
      })
    );
    this.ring.rotation.x = Math.PI / 2.35;
    this.group.add(this.ring);
  }

  addParticles() {
    const sparkGeometry = new THREE.SphereGeometry(0.025, 8, 8);
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: this.palette.primary,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < 34; i++) {
      const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
      const angle = (i / 34) * Math.PI * 2;
      const radius = 1.2 + Math.random() * 1.5;
      const baseY = Math.random() * 1.8 - 0.7;
      spark.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
      spark.userData = { angle, baseY, radius, speed: 0.16 + Math.random() * 0.22 };
      this.particles.add(spark);
    }
    this.group.add(this.particles);
  }

  addContent() {
    const tablet = createRegionTablet(this.region);
    tablet.position.set(1.9, 0.48, -1.15);
    tablet.rotation.set(-0.04, -0.32, 0.02);
    tablet.scale.setScalar(0.78);
    this.group.add(tablet);
  }

  getCameraConfig() {
    return {
      position: [0, 1.25, 5.8],
      target: [0, 0, 0],
      orbitRadius: 0.24,
      orbitSpeed: 0.18,
      bobAmount: 0.06,
      bobSpeed: 0.5,
    };
  }

  update(t, dt) {
    super.update(t, dt);

    const breath = Math.sin(t * 1.4) * 0.08;
    this.core.rotation.y = t * 0.32;
    this.core.rotation.x = t * 0.14;
    this.core.scale.setScalar(1 + breath);
    this.ring.rotation.z = t * 0.18;
    this.graceLight.intensity = 10.5 + Math.sin(t * 2.1) * 2.2;

    for (const spark of this.particles.children) {
      const data = spark.userData;
      const angle = data.angle + t * data.speed;
      spark.position.x = Math.cos(angle) * data.radius;
      spark.position.z = Math.sin(angle) * data.radius;
      spark.position.y = data.baseY + Math.sin(t * 1.6 + data.angle) * 0.12;
    }
  }
}

class LimgraveScene extends RegionScene {
  group = new THREE.Group();
  grace = null;
  graceLight = null;
  graceHalo = null;
  graceFlame = null;
  gracePool = null;
  motes = null;
  moteData = [];
  tablet = null;
  tabletHitbox = null;
  tabletHint = null;
  tabletOverlay = null;
  isTabletFocused = false;
  tabletFocusProgress = 0;
  hasOpenedTabletOverlay = false;
  baseLookTarget = new THREE.Vector3(0, 0.18, -0.82);
  focusCameraPosition = new THREE.Vector3(0.26, 1.5, 0.5);
  focusTarget = new THREE.Vector3(0.04, 1.42, -1.18);
  currentLookTarget = new THREE.Vector3(0, 0.18, -0.82);

  init() {
    this.scene.background = createNightSkyTexture();
    this.scene.fog = new THREE.FogExp2(0x101526, 0.032);
    this.scene.add(this.group);
    this.addLighting();
    this.addGround();
    this.addSiteOfGrace();
    this.addTablet();
    this.addRocks();
    this.addGrass();
    this.addParticles();
  }

  addLighting() {
    const moon = new THREE.DirectionalLight(0x9fb8ff, 1.2);
    moon.position.set(-4, 7, 5);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -14;
    moon.shadow.camera.right = 14;
    moon.shadow.camera.top = 14;
    moon.shadow.camera.bottom = -14;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 28;
    this.scene.add(moon);

    const ambient = new THREE.AmbientLight(0x1f2745, 0.72);
    this.scene.add(ambient);

    const horizonFill = new THREE.HemisphereLight(0x2c385e, 0x12180f, 0.68);
    this.scene.add(horizonFill);
  }

  addGround() {
    const geometry = new THREE.PlaneGeometry(60, 60, 110, 110);
    const position = geometry.attributes.position;
    const colors = [];
    const low = new THREE.Color(0x34431d);
    const high = new THREE.Color(0x70803d);
    const temp = new THREE.Color();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const hill =
        Math.sin(x * 0.23) * 0.22 +
        Math.cos(y * 0.19) * 0.18 +
        Math.sin((x + y) * 0.11) * 0.14;
      const falloff = Math.min(1, Math.hypot(x, y) / 32);
      const height = hill * (0.35 + falloff * 0.65);
      position.setZ(i, height);
      temp.copy(low).lerp(high, THREE.MathUtils.clamp((height + 0.5) / 1.2, 0, 1));
      colors.push(temp.r, temp.g, temp.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);

    const ground = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x4a5a2a,
        vertexColors: true,
        roughness: 0.95,
        metalness: 0,
      })
    );
    ground.position.y = -0.92;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  addSiteOfGrace() {
    this.grace = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xfff2a6,
        transparent: true,
        opacity: 1,
      })
    );
    this.grace.position.set(0, -0.18, 0);
    this.group.add(this.grace);

    this.graceLight = new THREE.PointLight(0xf0d060, 3.2, 9);
    this.graceLight.position.set(0, 0.05, 0);
    this.graceLight.castShadow = true;
    this.group.add(this.graceLight);

    this.gracePool = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 64),
      new THREE.MeshBasicMaterial({
        map: createLightPoolTexture(),
        color: 0xf0d060,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.gracePool.rotation.x = -Math.PI / 2;
    this.gracePool.position.set(0, -0.89, 0);
    this.group.add(this.gracePool);

    this.graceHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialGlowTexture('#f0d060'),
        color: 0xf0d060,
        transparent: true,
        opacity: 0.76,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.graceHalo.position.set(0, 0.02, 0);
    this.graceHalo.scale.set(1.05, 1.55, 1);
    this.group.add(this.graceHalo);

    this.graceFlame = new THREE.Group();
    const flameTexture = createGraceFlameTexture();
    const wisps = [
      { x: 0, y: 0.15, z: 0, sx: 0.42, sy: 1.95, opacity: 0.94, phase: 0, speed: 1.2 },
      { x: -0.04, y: 0.12, z: 0.03, sx: 0.3, sy: 1.65, opacity: 0.62, phase: 1.7, speed: 1.6 },
      { x: 0.05, y: 0.08, z: -0.02, sx: 0.24, sy: 1.38, opacity: 0.48, phase: 3.1, speed: 1.45 },
      { x: 0.02, y: 0.42, z: 0.01, sx: 0.18, sy: 0.92, opacity: 0.52, phase: 4.4, speed: 1.9 },
    ];

    for (const wisp of wisps) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: flameTexture,
          color: 0xffef9a,
          transparent: true,
          opacity: wisp.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sprite.position.set(wisp.x, wisp.y, wisp.z);
      sprite.scale.set(wisp.sx, wisp.sy, 1);
      sprite.userData = {
        baseX: wisp.x,
        baseY: wisp.y,
        baseScaleX: wisp.sx,
        baseScaleY: wisp.sy,
        baseOpacity: wisp.opacity,
        phase: wisp.phase,
        speed: wisp.speed,
      };
      this.graceFlame.add(sprite);
    }

    this.group.add(this.graceFlame);
  }

  addTablet() {
    this.tablet = createRegionTablet(this.region);
    this.tablet.position.set(0, 0.62, -1.18);
    this.tablet.rotation.set(-0.06, 0.08, -0.025);
    this.tablet.castShadow = true;
    this.tablet.receiveShadow = true;
    this.tablet.userData.clickable = true;
    this.group.add(this.tablet);

    this.tabletHitbox = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 3.35),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    this.tabletHitbox.position.copy(this.tablet.position);
    this.tabletHitbox.rotation.copy(this.tablet.rotation);
    this.tabletHitbox.translateZ(0.18);
    this.tabletHitbox.userData.clickTarget = 'tablet';
    this.group.add(this.tabletHitbox);

    this.tabletHint = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createHintTexture('Click tablet to read'),
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      })
    );
    this.tabletHint.position.set(0, 2.28, -1.02);
    this.tabletHint.scale.set(1.7, 0.34, 1);
    this.group.add(this.tabletHint);

    this.tabletOverlay = createTabletReaderOverlay(
      getRegionContent(this.region),
      () => this.#closeTabletReader()
    );
  }

  addRocks() {
    const material = new THREE.MeshStandardMaterial({
      color: 0x555246,
      roughness: 0.96,
      metalness: 0.02,
    });
    const rocks = [
      [-1.7, -0.76, 0.85, 0.34],
      [1.55, -0.78, 0.45, 0.24],
      [-2.6, -0.74, -1.8, 0.48],
      [2.9, -0.76, -2.4, 0.4],
      [-4.6, -0.72, -4.2, 0.7],
      [4.2, -0.74, -5.4, 0.58],
    ];

    for (const [x, y, z, scale] of rocks) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), material);
      rock.position.set(x, y, z);
      rock.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.3);
      rock.scale.set(scale * 1.2, scale * 0.45, scale * 0.8);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }
  }

  addGrass() {
    const geometry = createGrassBladeGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: 0x5f7d3d,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const grass = new THREE.InstancedMesh(geometry, material, 520);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    for (let i = 0; i < grass.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 9.8;
      position.set(Math.cos(angle) * radius, -0.9 + Math.random() * 0.05, Math.sin(angle) * radius - 1.8);
      euler.set((Math.random() - 0.5) * 0.32, Math.random() * Math.PI, (Math.random() - 0.5) * 0.42);
      quaternion.setFromEuler(euler);
      const bladeScale = 0.7 + Math.random() * 1.55;
      scale.set(0.65 + Math.random() * 0.8, bladeScale, 0.65 + Math.random() * 0.55);
      matrix.compose(position, quaternion, scale);
      grass.setMatrixAt(i, matrix);
    }

    grass.castShadow = true;
    grass.receiveShadow = true;
    this.group.add(grass);
  }

  addParticles() {
    const count = 55;
    const positions = new Float32Array(count * 3);
    this.moteData = [];

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 1.1;
      const angle = Math.random() * Math.PI * 2;
      const y = Math.random() * 2.8 - 0.6;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      this.moteData.push({
        angle,
        radius,
        y,
        speed: 0.18 + Math.random() * 0.28,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xf0d060,
        size: 0.045,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.group.add(this.motes);
  }

  getCameraConfig() {
    return {
      position: [0, 1.45, 5.45],
      target: [0, 0.18, -0.82],
      orbitRadius: 0,
      orbitSpeed: 0,
      mouseInfluence: 0.55,
      bobAmount: 0.018,
      bobSpeed: 0.36,
    };
  }

  update(t, dt) {
    super.update(t, dt);
    const pulse = 1 + Math.sin(t * 2.4) * 0.12;
    this.grace.scale.setScalar(pulse);
    this.grace.position.y = -0.18 + Math.sin(t * 1.7) * 0.025;
    this.graceHalo.scale.set(1.02 + Math.sin(t * 2.1) * 0.12, 1.52 + Math.sin(t * 1.8) * 0.2, 1);
    this.graceHalo.material.opacity = 0.62 + Math.sin(t * 2.2) * 0.14;
    this.gracePool.scale.setScalar(1 + Math.sin(t * 1.25) * 0.06);
    this.gracePool.material.opacity = 0.42 + Math.sin(t * 1.5) * 0.08;
    this.graceLight.intensity = 3.15 + Math.sin(t * 2.2) * 0.55;
    this.tabletHint.material.opacity = this.isTabletFocused
      ? THREE.MathUtils.lerp(this.tabletHint.material.opacity, 0, 0.08)
      : 0.68 + Math.sin(t * 2.4) * 0.08;

    this.#updateTabletFocus(dt);

    if (this.tabletFocusProgress > 0.001 && this.cameraRig) {
      const camera = this.cameraRig.camera;
      const eased = smootherStep(this.tabletFocusProgress);
      const lookEase = smootherStep(Math.max(0, this.tabletFocusProgress - 0.08) / 0.92);
      const rigPosition = camera.position.clone();
      camera.position.lerpVectors(rigPosition, this.focusCameraPosition, eased);
      camera.zoom = THREE.MathUtils.lerp(1, 1.95, smootherStep(Math.max(0, this.tabletFocusProgress - 0.18) / 0.82));
      camera.updateProjectionMatrix();
      this.currentLookTarget.lerpVectors(this.baseLookTarget, this.focusTarget, lookEase);
      camera.lookAt(this.currentLookTarget);
    } else if (this.cameraRig?.camera.zoom !== 1) {
      const camera = this.cameraRig.camera;
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, 1, 0.08);
      camera.updateProjectionMatrix();
      this.currentLookTarget.copy(this.baseLookTarget);
    }

    for (const sprite of this.graceFlame.children) {
      const data = sprite.userData;
      const sway = Math.sin(t * data.speed + data.phase);
      const breath = Math.sin(t * (data.speed + 0.4) + data.phase * 0.7);
      sprite.position.x = data.baseX + sway * 0.035;
      sprite.position.y = data.baseY + breath * 0.035;
      sprite.scale.set(
        data.baseScaleX * (1 + breath * 0.12),
        data.baseScaleY * (1 + sway * 0.08),
        1
      );
      sprite.material.opacity = data.baseOpacity + breath * 0.08;
    }

    const positions = this.motes.geometry.attributes.position;
    for (let i = 0; i < this.moteData.length; i++) {
      const mote = this.moteData[i];
      mote.y += dt * mote.speed;
      if (mote.y > 3.2) mote.y = -0.65;

      const angle = mote.angle + t * 0.18;
      const wobble = Math.sin(t * 1.4 + mote.wobble) * 0.08;
      positions.setXYZ(
        i,
        Math.cos(angle) * (mote.radius + wobble),
        mote.y,
        Math.sin(angle) * (mote.radius + wobble)
      );
    }
    positions.needsUpdate = true;
  }

  getInteractiveObjects() {
    return [this.tabletHitbox, this.tablet].filter(Boolean);
  }

  handleSceneClick(hit) {
    if (this.#isTabletHit(hit)) {
      this.#openTabletReader();
    }
  }

  handleSceneMiss() {
    if (!this.tabletOverlay?.classList.contains('is-visible')) {
      this.#closeTabletReader();
    }
  }

  handleSceneHover(hit) {
    if (!this.tabletHint || this.isTabletFocused) return;
    const isTabletHit = this.#isTabletHit(hit);
    this.tabletHint.scale.set(isTabletHit ? 1.84 : 1.7, isTabletHit ? 0.38 : 0.34, 1);
  }

  #isTabletHit(hit) {
    return hit?.object === this.tablet || hit?.object === this.tabletHitbox || hit?.object?.parent === this.tablet;
  }

  #openTabletReader() {
    this.isTabletFocused = true;
    this.hasOpenedTabletOverlay = false;
  }

  #closeTabletReader() {
    this.isTabletFocused = false;
    this.hasOpenedTabletOverlay = false;
    this.#hideTabletOverlay();
  }

  #updateTabletFocus(dt) {
    const target = this.isTabletFocused ? 1 : 0;
    const speed = this.isTabletFocused ? 1.18 : 1.65;
    this.tabletFocusProgress = THREE.MathUtils.clamp(
      this.tabletFocusProgress + Math.sign(target - this.tabletFocusProgress) * dt * speed,
      0,
      1
    );

    if (this.isTabletFocused && !this.hasOpenedTabletOverlay && this.tabletFocusProgress > 0.86) {
      this.hasOpenedTabletOverlay = true;
      this.#showTabletOverlay();
    }
  }

  #showTabletOverlay() {
    const body = this.tabletOverlay?.querySelector('.tablet-reader__body');
    if (body) body.scrollTop = 0;
    this.tabletOverlay?.classList.add('is-visible');
    this.tabletOverlay?.setAttribute('aria-hidden', 'false');
  }

  #hideTabletOverlay() {
    this.tabletOverlay?.classList.remove('is-visible');
    this.tabletOverlay?.setAttribute('aria-hidden', 'true');
  }

  exit() {
    this.#closeTabletReader();
    this.tabletFocusProgress = 0;
    super.exit();
  }

  dispose() {
    this.tabletOverlay?.remove();
    super.dispose();
  }
}

class ProjectsScene extends GraceRegionScene {
  addHeroObject() {
    super.addHeroObject();
    const rune = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.42, 0.055, 96, 10),
      new THREE.MeshStandardMaterial({
        color: this.palette.accent,
        emissive: this.palette.accent,
        emissiveIntensity: 0.42,
        roughness: 0.35,
      })
    );
    rune.position.set(0, 0.15, 0);
    this.group.add(rune);
    this.contentObject = rune;
  }

  update(t, dt) {
    super.update(t, dt);
    this.contentObject.rotation.y = -t * 0.36;
  }
}

class SkillsScene extends GraceRegionScene {
  addGround() {
    super.addGround();
    const grid = new THREE.GridHelper(5.4, 18, this.palette.primary, this.palette.accent);
    grid.position.y = -1.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    this.group.add(grid);
  }
}

class ContactScene extends GraceRegionScene {
  getCameraConfig() {
    return {
      position: [0.6, 1.35, 5.4],
      target: [0, 0.1, 0],
      orbitRadius: 0.18,
      orbitSpeed: 0.14,
      bobAmount: 0.05,
      bobSpeed: 0.48,
    };
  }
}

class ExperienceScene extends GraceRegionScene {
  addHeroObject() {
    super.addHeroObject();
    const path = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.08, 2.7),
      new THREE.MeshStandardMaterial({
        color: this.palette.accent,
        emissive: this.palette.accent,
        emissiveIntensity: 0.24,
        roughness: 0.62,
      })
    );
    path.position.set(0, -0.86, 0.35);
    path.rotation.y = 0.32;
    this.group.add(path);
  }
}

function getSceneClass(index) {
  return [
    LimgraveScene,
    ProjectsScene,
    SkillsScene,
    ContactScene,
    ExperienceScene,
  ][index] ?? GraceRegionScene;
}

function createRegionTablet(region) {
  return new ContentTablet(getRegionContent(region));
}

function getRegionContent(region) {
  return regionContent[region.name] ?? {
    title: region.name,
    body: region.desc,
    metadata: region.tag,
  };
}

function createTabletReaderOverlay(content, onClose) {
  const app = document.getElementById('app');
  const overlay = document.createElement('section');
  overlay.className = 'tablet-reader';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `${content.title} tablet text`);

  const panel = document.createElement('article');
  panel.className = 'tablet-reader__panel';

  const closeButton = document.createElement('button');
  closeButton.className = 'tablet-reader__close';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', onClose);

  const eyebrow = document.createElement('p');
  eyebrow.className = 'tablet-reader__eyebrow';
  eyebrow.textContent = content.metadata ?? '';

  const title = document.createElement('h2');
  title.className = 'tablet-reader__title';
  title.textContent = content.title;

  const body = document.createElement('div');
  body.className = 'tablet-reader__body';

  for (const paragraph of content.body.split('\n\n')) {
    const text = paragraph.trim();
    if (!text) continue;

    const p = document.createElement('p');
    p.textContent = text;
    body.append(p);
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) onClose();
  });

  panel.append(closeButton, eyebrow, title, body);
  overlay.append(panel);
  app?.append(overlay);
  return overlay;
}

function smootherStep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

function createNightSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(7349);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

  gradient.addColorStop(0, '#020511');
  gradient.addColorStop(0.3, '#071025');
  gradient.addColorStop(0.58, '#111830');
  gradient.addColorStop(0.78, '#171827');
  gradient.addColorStop(1, '#070909');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const moonX = 1540;
  const moonY = 190;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 640);
  moonGlow.addColorStop(0, 'rgba(215, 224, 255, 0.3)');
  moonGlow.addColorStop(0.18, 'rgba(148, 170, 230, 0.16)');
  moonGlow.addColorStop(0.55, 'rgba(80, 102, 166, 0.07)');
  moonGlow.addColorStop(1, 'rgba(10, 16, 34, 0)');
  ctx.fillStyle = moonGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMoonlitClouds(ctx, canvas, random);
  drawHorizonAtmosphere(ctx, canvas);
  drawSkyGrain(ctx, canvas, random);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function drawMoonlitClouds(ctx, canvas, random) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(30px)';

  for (let band = 0; band < 5; band++) {
    const y = canvas.height * (0.18 + band * 0.13) + (random() - 0.5) * 60;
    const alpha = 0.035 + band * 0.01;

    for (let i = 0; i < 22; i++) {
      const x = random() * canvas.width;
      const rx = 130 + random() * 280;
      const ry = 16 + random() * 46;
      const tilt = (random() - 0.5) * 0.18;
      const light = 126 + Math.floor(random() * 54);

      ctx.fillStyle = `rgba(${light}, ${light + 12}, ${Math.min(255, light + 42)}, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(x, y + (random() - 0.5) * 76, rx, ry, tilt, 0, Math.PI * 2);
      ctx.fill();

      if (x < rx) {
        ctx.beginPath();
        ctx.ellipse(x + canvas.width, y, rx, ry, tilt, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = 'blur(46px)';
  ctx.fillStyle = 'rgba(5, 8, 16, 0.28)';

  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.ellipse(
      random() * canvas.width,
      canvas.height * (0.46 + random() * 0.28),
      180 + random() * 320,
      32 + random() * 76,
      (random() - 0.5) * 0.28,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawHorizonAtmosphere(ctx, canvas) {
  const horizon = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
  horizon.addColorStop(0, 'rgba(40, 50, 86, 0)');
  horizon.addColorStop(0.44, 'rgba(42, 48, 76, 0.12)');
  horizon.addColorStop(0.76, 'rgba(12, 15, 18, 0.32)');
  horizon.addColorStop(1, 'rgba(2, 4, 4, 0.72)');

  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSkyGrain(ctx, canvas, random) {
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = canvas.width;
  grainCanvas.height = canvas.height;
  const grainCtx = grainCanvas.getContext('2d');
  const image = grainCtx.createImageData(canvas.width, canvas.height);

  for (let i = 0; i < image.data.length; i += 4) {
    const value = 185 + Math.floor(random() * 70);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = 255;
    image.data[i + 3] = random() > 0.54 ? 5 : 0;
  }

  grainCtx.putImageData(image, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createGrassBladeGeometry() {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -0.035, 0, 0,
    0.035, 0, 0,
    0.018, 0.34, 0.018,
    -0.035, 0, 0,
    0.018, 0.34, 0.018,
    0, 0.58, -0.012,
  ]);
  const uvs = new Float32Array([
    0, 0,
    1, 0,
    0.72, 0.62,
    0, 0,
    0.72, 0.62,
    0.5, 1,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function createHintTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createRadialGradient(384, 82, 12, 384, 82, 350);
  bg.addColorStop(0, 'rgba(10, 8, 4, 0.72)');
  bg.addColorStop(0.68, 'rgba(10, 8, 4, 0.36)');
  bg.addColorStop(1, 'rgba(10, 8, 4, 0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(201, 168, 76, 0.48)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(96, 118);
  ctx.lineTo(672, 118);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0d060';
  ctx.font = '36px "Cormorant Garamond", Georgia, serif';
  ctx.shadowColor = 'rgba(240, 208, 96, 0.55)';
  ctx.shadowBlur = 12;
  ctx.fillText(text, canvas.width / 2, 72);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRadialGlowTexture(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);

  gradient.addColorStop(0, color);
  gradient.addColorStop(0.16, color);
  gradient.addColorStop(0.5, 'rgba(240, 208, 96, 0.28)');
  gradient.addColorStop(1, 'rgba(240, 208, 96, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLightPoolTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);

  gradient.addColorStop(0, 'rgba(255, 244, 178, 0.95)');
  gradient.addColorStop(0.22, 'rgba(240, 208, 96, 0.48)');
  gradient.addColorStop(0.62, 'rgba(240, 208, 96, 0.12)');
  gradient.addColorStop(1, 'rgba(240, 208, 96, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGraceFlameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'lighter';

  drawFlameLobe(ctx, {
    color: 'rgba(255, 248, 185, 0.86)',
    blur: 28,
    width: 86,
    yTop: 46,
    yBottom: 470,
  });
  drawFlameLobe(ctx, {
    color: 'rgba(240, 208, 96, 0.5)',
    blur: 44,
    width: 132,
    yTop: 84,
    yBottom: 492,
  });
  drawFlameLobe(ctx, {
    color: 'rgba(255, 255, 220, 0.92)',
    blur: 12,
    width: 38,
    yTop: 116,
    yBottom: 430,
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function drawFlameLobe(ctx, { color, blur, width, yTop, yBottom }) {
  const center = 128;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.moveTo(center, yTop);
  ctx.bezierCurveTo(center + width * 0.72, yTop + 92, center + width * 0.48, yBottom - 110, center, yBottom);
  ctx.bezierCurveTo(center - width * 0.46, yBottom - 112, center - width * 0.64, yTop + 96, center, yTop);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
