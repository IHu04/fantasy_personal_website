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
  grass = null;
  grace = null;
  graceLight = null;
  graceHalo = null;
  graceFlame = null;
  gracePool = null;
  graceMotes = null;
  graceMoteData = [];
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
    this.addForest();
    this.addGrass();
    this.addParticles();
  }

  addLighting() {
    const moon = new THREE.DirectionalLight(0xb8c9ff, 1.55);
    moon.position.set(-5.2, 8.5, 4.8);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -14;
    moon.shadow.camera.right = 14;
    moon.shadow.camera.top = 14;
    moon.shadow.camera.bottom = -14;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 28;
    moon.shadow.bias = -0.00018;
    moon.shadow.normalBias = 0.018;
    this.scene.add(moon);

    const ambient = new THREE.AmbientLight(0x1b2440, 0.46);
    this.scene.add(ambient);

    const horizonFill = new THREE.HemisphereLight(0x32436f, 0x11170d, 0.82);
    this.scene.add(horizonFill);
  }

  addGround() {
    const geometry = new THREE.PlaneGeometry(60, 60, 160, 160);
    const position = geometry.attributes.position;
    const colors = [];
    const low = new THREE.Color(0x202915);
    const mid = new THREE.Color(0x46552a);
    const high = new THREE.Color(0x7a8845);
    const temp = new THREE.Color();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const hill =
        Math.sin(x * 0.23) * 0.22 +
        Math.cos(y * 0.19) * 0.18 +
        Math.sin((x + y) * 0.11) * 0.14 +
        Math.sin(x * 0.82 + y * 0.35) * 0.035 +
        Math.cos(y * 0.74 - x * 0.18) * 0.028;
      const falloff = Math.min(1, Math.hypot(x, y) / 32);
      const height = hill * (0.35 + falloff * 0.65);
      position.setZ(i, height);
      const grade = THREE.MathUtils.clamp((height + 0.52) / 1.12, 0, 1);
      temp.copy(low).lerp(mid, Math.min(1, grade * 1.35)).lerp(high, Math.max(0, grade - 0.62) * 0.55);
      colors.push(temp.r, temp.g, temp.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);
    const textures = createGroundTextureSet();

    const ground = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xd6ddbb,
        map: textures.color,
        roughnessMap: textures.roughness,
        bumpMap: textures.bump,
        bumpScale: 0.095,
        vertexColors: true,
        roughness: 0.98,
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
    this.graceLight.castShadow = false;
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
    const material = createRockMaterial();
    const rocks = [
      [-1.7, -0.76, 0.85, 0.34],
      [1.55, -0.78, 0.45, 0.24],
      [-2.6, -0.74, -1.8, 0.48],
      [2.9, -0.76, -2.4, 0.4],
      [-4.6, -0.72, -4.2, 0.7],
      [4.2, -0.74, -5.4, 0.58],
    ];

    rocks.forEach(([x, y, z, scale], index) => {
      const rock = new THREE.Mesh(createWeatheredRockGeometry(index + 11), material);
      rock.position.set(x, y, z);
      rock.rotation.set(index * 0.37, index * 1.91, -0.16 + index * 0.11);
      rock.scale.set(scale * 1.35, scale * 0.48, scale * 0.9);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    });
  }

  addForest() {
    const forest = new THREE.Group();
    const barkMaterial = createBarkMaterial();
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: createCanopyShadowTexture(),
      color: 0x1b2415,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const positions = [
      [-9.1, -9.5, 4.8, 1.05], [-6.6, -11.4, 3.9, 0.78], [-3.5, -12.9, 5.85, 0.92],
      [1.9, -12.6, 4.55, 0.74], [5.2, -10.9, 6.05, 1.04], [8.9, -8.1, 4.35, 0.88],
      [-10.7, -4.4, 5.25, 0.86], [10.2, -2.9, 3.7, 0.68], [-7.9, 0.6, 4.15, 0.62],
      [7.3, 1.4, 5.0, 0.7], [-11.2, -6.9, 3.95, 0.74], [11.0, -5.4, 5.55, 0.95],
      [-4.8, -7.4, 3.55, 0.55], [4.1, -7.9, 4.7, 0.6],
    ];

    positions.forEach(([x, z, height, scale], index) => {
      const random = seededRandom(411 + index * 53);
      const tree = createForestTree({
        height: height * (0.82 + random() * 0.36),
        scale: scale * (0.86 + random() * 0.32),
        seed: 140 + index * 17,
        barkMaterial,
      });
      tree.position.set(
        x + (random() - 0.5) * 0.92,
        -0.9 + (random() - 0.5) * 0.055,
        z + (random() - 0.5) * 0.82
      );
      tree.rotation.y = random() * Math.PI * 2;
      tree.rotation.x = (random() - 0.5) * 0.055;
      tree.rotation.z = (random() - 0.5) * 0.13;
      forest.add(tree);
    });

    const deepRows = [
      { z: -14.5, y: 1.72, count: 9, width: 24, scale: 1.06, opacity: 0.48 },
      { z: -17.2, y: 2.05, count: 11, width: 30, scale: 1.22, opacity: 0.34 },
      { z: -20.2, y: 2.28, count: 12, width: 36, scale: 1.36, opacity: 0.22 },
    ];

    deepRows.forEach((row, rowIndex) => {
      for (let i = 0; i < row.count; i++) {
        const t = row.count === 1 ? 0.5 : i / (row.count - 1);
        const seed = 900 + rowIndex * 101 + i * 13;
        const texture = createTreeImpostorTexture(seed);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          color: 0xd6e0c3,
          roughness: 1,
          metalness: 0,
          transparent: true,
          alphaTest: 0.08,
          opacity: row.opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const random = seededRandom(seed * 3);
        const width = (1.82 + random() * 1.55) * row.scale;
        const height = (4.35 + random() * 2.45) * row.scale;
        const treeCard = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 5, 12), material);
        treeCard.position.set(
          -row.width / 2 + t * row.width + (random() - 0.5) * 1.7,
          row.y + (random() - 0.5) * 0.62,
          row.z + (random() - 0.5) * 1.2
        );
        treeCard.rotation.y = (random() - 0.5) * 0.28;
        treeCard.rotation.z = (random() - 0.5) * 0.055;
        treeCard.scale.x *= random() > 0.5 ? 1 : -1;
        forest.add(treeCard);
      }
    });

    const forestFloor = new THREE.Mesh(
      new THREE.CircleGeometry(8.8, 72),
      shadowMaterial
    );
    forestFloor.rotation.x = -Math.PI / 2;
    forestFloor.position.set(0, -0.885, -6.8);
    forestFloor.scale.set(1.6, 0.72, 1);
    forest.add(forestFloor);

    this.group.add(forest);
  }

  addGrass() {
    const geometry = createGrassBladeGeometry(7);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc8d8a0,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
      vertexColors: true,
    });
    const grass = new THREE.InstancedMesh(geometry, material, 1450);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();
    const color = new THREE.Color();
    const baseColor = new THREE.Color(0x526d32);
    const paleColor = new THREE.Color(0x9aa76a);
    const darkColor = new THREE.Color(0x263517);

    for (let i = 0; i < grass.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.55 + Math.pow(Math.random(), 0.68) * 12.5;
      const clump = Math.sin(angle * 5.0 + radius * 0.72) * 0.35;
      position.set(
        Math.cos(angle) * (radius + clump),
        -0.91 + Math.random() * 0.055,
        Math.sin(angle) * radius - 1.65
      );
      euler.set((Math.random() - 0.5) * 0.22, Math.random() * Math.PI, (Math.random() - 0.5) * 0.34);
      quaternion.setFromEuler(euler);
      const bladeScale = 0.55 + Math.random() * 1.65;
      scale.set(0.7 + Math.random() * 1.25, bladeScale, 0.7 + Math.random() * 0.75);
      matrix.compose(position, quaternion, scale);
      grass.setMatrixAt(i, matrix);
      color.copy(baseColor)
        .lerp(paleColor, Math.random() * 0.52)
        .lerp(darkColor, Math.random() * 0.32);
      grass.setColorAt(i, color);
    }

    grass.castShadow = true;
    grass.receiveShadow = true;
    grass.instanceMatrix.needsUpdate = true;
    grass.instanceColor.needsUpdate = true;
    this.grass = grass;
    this.group.add(this.grass);
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

// ── Projects catalog ──────────────────────────────────────────
// Replace these placeholders with real hackathon / personal project entries.
const projectsCatalog = [
  {
    title: 'Hackathon · Project One',
    eyebrow: 'Hack the North · 2024',
    body: 'A short paragraph describing the build, the team, and the impact. Talk about what was novel, what shipped, and what surprised you. Keep it 2–4 sentences for stone-tablet legibility in the overlay.',
  },
  {
    title: 'Personal · Project Two',
    eyebrow: 'Solo Build · 2024',
    body: 'Describe a side project that taught you something. Mention the stack, the constraint, and the artifact that came out of it. Link or screenshot can be added in the overlay later.',
  },
  {
    title: 'Hackathon · Project Three',
    eyebrow: 'TreeHacks · 2023',
    body: 'A weekend project shaped under pressure. Replace with the real one — judges, prize, pivots, lessons.',
  },
  {
    title: 'Personal · Project Four',
    eyebrow: 'Open Source · 2023',
    body: 'A library, plugin, or experiment kept on GitHub. Replace this with the actual repo, the problem it solves, and the most interesting design choice.',
  },
  {
    title: 'Hackathon · Project Five',
    eyebrow: 'PennApps · 2022',
    body: 'Another team build worth pointing at. Describe the brief, the demo, and what got built between coffee runs.',
  },
  {
    title: 'Personal · Project Six',
    eyebrow: 'Studio · 2022',
    body: 'A polish project — long-form, iterative, the kind of thing that shows depth. Replace with the real description and outcome.',
  },
];

// ── Projects scene: a white marble colosseum ──────────────────
class ProjectsScene extends RegionScene {
  group = new THREE.Group();

  // Grace
  grace = null;
  graceLight = null;
  graceHalo = null;
  graceFlame = null;
  gracePool = null;
  graceMotes = null;
  graceMoteData = [];

  // Architecture
  columnRing = null;
  innerLintel = null;
  centerDais = null;

  // Project markers
  markers = [];
  hoveredMarker = null;
  focusedMarker = null;
  focusProgress = 0;
  hasOpenedOverlay = false;

  // Atmosphere
  hint = null;

  // Camera focus
  baseCameraPosition = new THREE.Vector3(0, 2.55, 6.4);
  baseLookTarget = new THREE.Vector3(0, 0.45, 0);
  currentLookTarget = new THREE.Vector3(0, 0.45, 0);
  focusCameraPosition = new THREE.Vector3();
  focusLookTarget = new THREE.Vector3();

  stoneOverlay = null;

  init() {
    this.scene.background = createColosseumSkyTexture();
    this.scene.fog = new THREE.FogExp2(0xf0dfbd, 0.029);
    this.scene.add(this.group);

    this.addLighting();
    this.addArenaFloor();
    this.addCenterDais();
    this.addColosseumStructure();
    this.addSwordReliquary();
    this.addSiteOfGrace();
    this.addProjectMarkers();
    this.addAtmosphere();
    this.addHint();

    this.stoneOverlay = createStoneReaderOverlay(() => this.#closeReader());
  }

  // ── Lighting (warm Mediterranean noon) ──────────────────────
  addLighting() {
    const ambient = new THREE.AmbientLight(0xfff2d8, 0.72);
    this.scene.add(ambient);

    // Sun — strong, warm, casts the long colonnade shadows
    const sun = new THREE.DirectionalLight(0xfff0c4, 2.55);
    sun.position.set(5, 16, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.left = -8.5;
    sun.shadow.camera.right = 8.5;
    sun.shadow.camera.top = 8.5;
    sun.shadow.camera.bottom = -8.5;
    sun.shadow.camera.near = 4;
    sun.shadow.camera.far = 28;
    sun.shadow.bias = -0.00004;
    sun.shadow.normalBias = 0.045;
    sun.shadow.radius = 5;
    sun.shadow.blurSamples = 16;
    this.scene.add(sun);

    // Sky fill — pale blue from above, warm sand bounce from below
    const hemi = new THREE.HemisphereLight(0xd7edff, 0xb99b68, 1.12);
    this.scene.add(hemi);

    // Soft warm fill from camera-side to lift the front faces
    const fill = new THREE.DirectionalLight(0xffe8ba, 0.72);
    fill.position.set(-3, 5, 8);
    this.scene.add(fill);
  }

  // ── Arena floor ─────────────────────────────────────────────
  addArenaFloor() {
    const geometry = createSandTerrainGeometry(120, 180);
    const textures = createSandstoneFloorTextureSet();
    this.floor = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: textures.color,
        roughnessMap: textures.roughness,
        bumpMap: textures.bump,
        bumpScale: 0.072,
        color: 0xd9c9a0,
        roughness: 0.94,
        metalness: 0,
      })
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.955;
    this.floor.receiveShadow = true;
    this.group.add(this.floor);

    const horizonHaze = new THREE.Mesh(
      new THREE.RingGeometry(12, 58, 192),
      new THREE.MeshBasicMaterial({
        color: 0xf3ddb0,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    horizonHaze.rotation.x = -Math.PI / 2;
    horizonHaze.position.y = -0.888;
    this.group.add(horizonHaze);

    const groundMist = new THREE.Mesh(
      new THREE.CircleGeometry(58, 192),
      new THREE.MeshBasicMaterial({
        map: createGroundHazeTexture(),
        color: 0xf4dfb8,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    groundMist.rotation.x = -Math.PI / 2;
    groundMist.position.y = -0.884;
    this.group.add(groundMist);

    const horizonMist = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createHorizonMistTexture(),
        color: 0xf6dcaa,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        depthTest: false,
      })
    );
    horizonMist.position.set(0, 0.72, -15.5);
    horizonMist.scale.set(50, 12.5, 1);
    this.group.add(horizonMist);

    const whiteMarbleTextures = createMarbleTextureSet({ brightness: 1.2, veinStrength: 0.22, speckStrength: 0.25 });
    const marbleFloor = new THREE.Mesh(
      new THREE.CircleGeometry(5.95, 128),
      new THREE.MeshStandardMaterial({
        color: 0xfffbf0,
        roughness: 0.58,
        metalness: 0.02,
        map: whiteMarbleTextures.color,
        roughnessMap: whiteMarbleTextures.roughness,
        bumpMap: whiteMarbleTextures.bump,
        bumpScale: 0.025,
      })
    );
    marbleFloor.rotation.x = -Math.PI / 2;
    marbleFloor.position.y = -0.902;
    marbleFloor.receiveShadow = true;
    this.group.add(marbleFloor);

    const outerInlay = new THREE.Mesh(
      new THREE.TorusGeometry(5.95, 0.025, 12, 160),
      createMarbleMaterial({ tint: 0xffffff, brightness: 1.16, veinStrength: 0.24, speckStrength: 0.25 })
    );
    outerInlay.rotation.x = Math.PI / 2;
    outerInlay.position.y = -0.885;
    outerInlay.receiveShadow = true;
    this.group.add(outerInlay);

    const innerInlay = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.015, 10, 120),
      createMarbleMaterial({ tint: 0xded8cb, brightness: 1.05, veinStrength: 0.28, speckStrength: 0.28 })
    );
    innerInlay.rotation.x = Math.PI / 2;
    innerInlay.position.y = -0.884;
    innerInlay.receiveShadow = true;
    this.group.add(innerInlay);
  }

  // ── Raised circular dais where the Grace burns ──────────────
  addCenterDais() {
    const marbleMat = createMarbleMaterial({ veinStrength: 0.32, speckStrength: 0.35 });
    // Two-step plinth — wide bottom, narrower top
    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.65, 0.18, 64),
      marbleMat
    );
    lower.position.y = -0.83;
    lower.castShadow = true;
    lower.receiveShadow = true;
    this.group.add(lower);

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.32, 0.14, 64),
      marbleMat
    );
    upper.position.y = -0.67;
    upper.castShadow = true;
    upper.receiveShadow = true;
    this.group.add(upper);
    this.centerDais = upper;
  }

  // ── Sword reliquary behind the project stones ───────────────
  addSwordReliquary() {
    const reliquary = new THREE.Group();
    reliquary.position.set(0, -0.9, -4.45);
    reliquary.rotation.y = -0.03;

    const stone = createMarbleMaterial({ tint: 0x9f947f, veinStrength: 0.48, speckStrength: 0.52 });
    const darkStone = createMarbleMaterial({ tint: 0x756b5a, veinStrength: 0.6, speckStrength: 0.62 });
    const metal = new THREE.MeshStandardMaterial({
      color: 0xd7d1bd,
      emissive: 0x3a3020,
      emissiveIntensity: 0.08,
      roughness: 0.2,
      metalness: 0.64,
      envMapIntensity: 0.55,
    });
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x302820,
      roughness: 0.38,
      metalness: 0.62,
    });
    const oldGold = new THREE.MeshStandardMaterial({
      color: 0xb88c38,
      emissive: 0x5a3f12,
      emissiveIntensity: 0.12,
      roughness: 0.42,
      metalness: 0.55,
    });

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(2.28, 0.07, 0.24),
      darkStone
    );
    rail.position.y = 0.13;
    rail.castShadow = true;
    rail.receiveShadow = true;
    reliquary.add(rail);

    const restPositions = [-0.58, 0.62];
    for (const x of restPositions) {
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.14, 0.42),
        stone
      );
      foot.position.set(x, 0.16 + (x > 0 ? 0.08 : 0), 0);
      foot.castShadow = true;
      foot.receiveShadow = true;
      reliquary.add(foot);

      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.38, 0.22),
        darkStone
      );
      post.position.set(x, 0.43 + (x > 0 ? 0.08 : 0), 0);
      post.castShadow = true;
      post.receiveShadow = true;
      reliquary.add(post);

      const leftProng = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.28, 0.14),
        stone
      );
      leftProng.position.set(x - 0.1, 0.69 + (x > 0 ? 0.08 : 0), 0);
      leftProng.rotation.z = -0.16;
      leftProng.castShadow = true;
      leftProng.receiveShadow = true;
      reliquary.add(leftProng);

      const rightProng = leftProng.clone();
      rightProng.position.x = x + 0.1;
      rightProng.rotation.z = 0.16;
      reliquary.add(rightProng);
    }

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-0.62, 0.018);
    bladeShape.bezierCurveTo(-0.18, 0.02, 0.58, 0.06, 1.18, 0.14);
    bladeShape.lineTo(1.42, 0.205);
    bladeShape.lineTo(1.29, 0.065);
    bladeShape.bezierCurveTo(0.58, -0.06, -0.18, -0.11, -0.62, -0.13);
    bladeShape.lineTo(-0.62, 0.018);

    const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.026,
      bevelEnabled: true,
      bevelThickness: 0.007,
      bevelSize: 0.007,
      bevelSegments: 1,
    });
    bladeGeometry.center();

    const blade = new THREE.Mesh(bladeGeometry, metal);
    blade.position.set(0.1, 0.76, 0.04);
    blade.rotation.z = 0;
    blade.castShadow = true;
    blade.receiveShadow = true;
    reliquary.add(blade);

    const tsuba = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.115, 0.048, 24),
      oldGold
    );
    tsuba.position.set(-0.92, 0.67, 0.052);
    tsuba.rotation.z = Math.PI / 2;
    tsuba.castShadow = true;
    reliquary.add(tsuba);

    const habaki = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.04, 0.11, 18),
      oldGold
    );
    habaki.position.set(-0.82, 0.666, 0.058);
    habaki.rotation.z = Math.PI / 2 + 0.02;
    habaki.castShadow = true;
    reliquary.add(habaki);

    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.056, 0.46, 18),
      darkMetal
    );
    grip.position.set(-1.17, 0.655, 0.052);
    grip.rotation.z = Math.PI / 2 + 0.025;
    grip.castShadow = true;
    reliquary.add(grip);

    const wrapMaterial = new THREE.MeshStandardMaterial({
      color: 0xc99f45,
      emissive: 0x3a2608,
      emissiveIntensity: 0.08,
      roughness: 0.42,
      metalness: 0.48,
    });
    for (let i = 0; i < 5; i++) {
      const wrap = new THREE.Mesh(
        new THREE.TorusGeometry(0.058, 0.006, 8, 18),
        wrapMaterial
      );
      wrap.position.set(-1.34 + i * 0.08, 0.65 + i * 0.002, 0.052);
      wrap.rotation.y = Math.PI / 2;
      wrap.rotation.z = 0.025;
      reliquary.add(wrap);
    }

    const pommel = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.075, 0),
      oldGold
    );
    pommel.position.set(-1.44, 0.648, 0.052);
    pommel.scale.set(0.85, 1.05, 0.75);
    pommel.castShadow = true;
    reliquary.add(pommel);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, 40),
      new THREE.MeshBasicMaterial({
        color: 0x4c3f2a,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1.62, 0.24, 1);
    shadow.position.y = 0.012;
    reliquary.add(shadow);

    reliquary.scale.setScalar(0.82);
    this.group.add(reliquary);
  }

  // ── Outer ring of fluted marble columns + lintel ────────────
  addColosseumStructure() {
    const marble = createMarbleMaterial({ tint: 0xd6ccb7, veinStrength: 0.34, speckStrength: 0.35 });
    const fluted = createMarbleMaterial({ tint: 0xcac0aa, flutedBump: true, veinStrength: 0.26, speckStrength: 0.25 });
    const weathered = createMarbleMaterial({ tint: 0xb9ad96, veinStrength: 0.4, speckStrength: 0.42 });
    const random = seededRandom(6419);

    const outerRadius = 7.05;
    const columnHeight = 3.2;
    const columnTopRadius = 0.34;
    const columnBottomRadius = 0.42;
    const ringSegments = 18;

    this.columnRing = new THREE.Group();
    this.group.add(this.columnRing);

    const baseGeometry = new THREE.BoxGeometry(1.0, 0.22, 1.0);
    const capitalGeometry = new THREE.BoxGeometry(0.9, 0.18, 0.9);

    const ringOffset = Math.PI / ringSegments; // half-step so no column sits directly in front
    for (let i = 0; i < ringSegments; i++) {
      const angle = ringOffset + (i / ringSegments) * Math.PI * 2;
      const cx = Math.sin(angle) * outerRadius;
      const cz = Math.cos(angle) * outerRadius;
      const damaged = random() > 0.62;
      const shaftHeight = columnHeight * (damaged ? THREE.MathUtils.lerp(0.62, 0.86, random()) : THREE.MathUtils.lerp(0.94, 1.03, random()));
      const shaftGeometry = new THREE.CylinderGeometry(
        columnTopRadius * THREE.MathUtils.lerp(0.88, 1.06, random()),
        columnBottomRadius * THREE.MathUtils.lerp(0.94, 1.1, random()),
        shaftHeight,
        28,
        1
      );

      const column = new THREE.Group();
      column.position.set(cx + (random() - 0.5) * 0.12, 0, cz + (random() - 0.5) * 0.12);
      column.lookAt(0, 0, 0);
      column.rotation.z += (random() - 0.5) * (damaged ? 0.035 : 0.012);

      const base = new THREE.Mesh(baseGeometry, marble);
      base.position.y = -0.81;
      base.castShadow = true;
      base.receiveShadow = true;
      column.add(base);

      const shaft = new THREE.Mesh(shaftGeometry, fluted);
      shaft.position.y = -0.81 + 0.22 / 2 + shaftHeight / 2;
      shaft.rotation.y = random() * Math.PI;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      column.add(shaft);

      if (!damaged || random() > 0.34) {
        const capital = new THREE.Mesh(capitalGeometry, marble);
        capital.position.y = -0.81 + 0.22 / 2 + shaftHeight + 0.09;
        capital.rotation.y = (random() - 0.5) * 0.08;
        capital.castShadow = true;
        capital.receiveShadow = true;
        column.add(capital);
      }

      this.columnRing.add(column);

      if (damaged) {
        const chip = new THREE.Mesh(
          new THREE.BoxGeometry(0.2 + random() * 0.32, 0.08 + random() * 0.16, 0.16 + random() * 0.28),
          weathered
        );
        chip.position.set(cx * 0.95 + (random() - 0.5) * 0.65, -0.82, cz * 0.95 + (random() - 0.5) * 0.65);
        chip.rotation.set(random() * 0.5, random() * Math.PI, (random() - 0.5) * 0.5);
        chip.castShadow = true;
        chip.receiveShadow = true;
        this.group.add(chip);
      }
    }

    const rubbleMat = createMarbleMaterial({ tint: 0xa99d88, veinStrength: 0.46, speckStrength: 0.48 });
    for (let i = 0; i < 24; i++) {
      const angle = random() * Math.PI * 2;
      const radius = THREE.MathUtils.lerp(4.45, 6.65, random());
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(0.1 + random() * 0.5, 0.06 + random() * 0.2, 0.1 + random() * 0.55),
        rubbleMat
      );
      rubble.position.set(Math.sin(angle) * radius, -0.86 + random() * 0.08, Math.cos(angle) * radius);
      rubble.rotation.set(random() * 0.7, random() * Math.PI, random() * 0.7);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      this.group.add(rubble);
    }
  }

  // ── Site of Grace at center of dais ─────────────────────────
  addSiteOfGrace() {
    const baseY = -0.6;  // dais top is at -0.67 + 0.07 ≈ -0.6 — sit grace just above

    this.grace = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 10),
      new THREE.MeshBasicMaterial({
        color: 0xf0c45a,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    this.grace.position.set(0, baseY + 0.7, 0);
    this.group.add(this.grace);

    this.graceLight = new THREE.PointLight(0xf0c45a, 2.55, 9);
    this.graceLight.position.set(0, baseY + 0.85, 0);
    this.graceLight.castShadow = true;
    this.group.add(this.graceLight);

    this.gracePool = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 64),
      new THREE.MeshBasicMaterial({
        map: createLightPoolTexture(),
        color: 0xe7b84e,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.gracePool.rotation.x = -Math.PI / 2;
    this.gracePool.position.set(0, baseY + 0.005, 0);
    this.gracePool.scale.setScalar(0.86);
    this.group.add(this.gracePool);

    this.graceHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialGlowTexture('#f0d060'),
        color: 0xe7b84e,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.graceHalo.position.set(0, baseY + 0.7, 0);
    this.graceHalo.scale.set(0.98, 1.42, 1);
    this.group.add(this.graceHalo);

    this.graceFlame = new THREE.Group();
    this.graceFlame.position.set(0, baseY + 0.48, 0);
    this.graceFlame.scale.setScalar(0.96);
    const flameTexture = createGraceFlameTexture();
    const wisps = [
      { x: 0, y: 0.08, z: 0, sx: 0.48, sy: 1.36, opacity: 0.54, phase: 0, speed: 1.2 },
      { x: -0.045, y: 0.07, z: 0.03, sx: 0.34, sy: 1.14, opacity: 0.36, phase: 1.7, speed: 1.6 },
      { x: 0.055, y: 0.06, z: -0.02, sx: 0.28, sy: 0.98, opacity: 0.32, phase: 3.1, speed: 1.45 },
      { x: 0.02, y: 0.28, z: 0.01, sx: 0.2, sy: 0.64, opacity: 0.3, phase: 4.4, speed: 1.9 },
    ];

    for (const wisp of wisps) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: flameTexture,
          color: 0xf2bd4d,
          transparent: true,
          opacity: wisp.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sprite.position.set(wisp.x, wisp.y, wisp.z);
      sprite.scale.set(wisp.sx, wisp.sy, 1);
      sprite.userData = {
        baseX: wisp.x, baseY: wisp.y,
        baseScaleX: wisp.sx, baseScaleY: wisp.sy,
        baseOpacity: wisp.opacity,
        phase: wisp.phase, speed: wisp.speed,
      };
      this.graceFlame.add(sprite);
    }
    this.group.add(this.graceFlame);

    this.addGraceMotes(baseY);
  }

  addGraceMotes(baseY) {
    const count = 52;
    const positions = new Float32Array(count * 3);
    this.graceMoteData = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.04 + Math.pow(Math.random(), 1.9) * 0.34;
      const y = Math.random() * 1.58;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = baseY + 0.28 + y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      this.graceMoteData.push({
        angle,
        radius,
        y,
        speed: 0.26 + Math.random() * 0.42,
        wobble: Math.random() * Math.PI * 2,
        drift: 0.12 + Math.random() * 0.24,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.graceMotes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffdc66,
        map: createRadialGlowTexture('#fff0a8'),
        size: 0.052,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    );
    this.graceMotes.renderOrder = 32;
    this.group.add(this.graceMotes);
  }

  // ── Project markers — four marble obelisks around an inner ring ─
  addProjectMarkers() {
    const ringRadius = 3.5;
    // Remove the two front tablets nearest the camera so back tablets stay open.
    const angles = [90, 150, 210, 270].map((d) => d * Math.PI / 180);
    const sharedMarble = createMarbleMaterial({ tint: 0xece5d2, brightness: 1.08, veinStrength: 0.26, speckStrength: 0.25 });

    projectsCatalog.slice(0, angles.length).forEach((project, index) => {
      const angle = angles[index];
      const x = Math.sin(angle) * ringRadius;
      const z = Math.cos(angle) * ringRadius;
      const marker = new ProjectMarker(project, sharedMarble, 700 + index * 31);
      marker.position.set(x, -0.92, z);
      // Face toward the Grace at origin
      marker.rotation.y = Math.atan2(x, z) + Math.PI;
      this.markers.push(marker);
      this.group.add(marker);
    });
  }

  addAtmosphere() {
    // Floating dust motes lit by sunlight — large area, sparse
    const count = 90;
    const positions = new Float32Array(count * 3);
    this.moteData = [];
    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.random() * 5.5;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3]     = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 4.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      this.moteData.push({
        baseY: positions[i * 3 + 1],
        speed: 0.04 + Math.random() * 0.06,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    const motesGeom = new THREE.BufferGeometry();
    motesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motes = new THREE.Points(
      motesGeom,
      new THREE.PointsMaterial({
        color: 0xfff5d6,
        size: 0.04,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.group.add(this.motes);
  }

  addHint() {
    this.hint = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createHintTexture('Click a tablet to read'),
        transparent: true,
        opacity: 0.78,
        depthTest: false,
        depthWrite: false,
      })
    );
    this.hint.position.set(0, 2.62, 1.65);
    this.hint.scale.set(1.82, 0.36, 1);
    this.hint.renderOrder = 46;
    this.group.add(this.hint);
  }

  getCameraConfig() {
    return {
      position: [0, 2.55, 6.4],
      target: [0, 0.45, 0],
      orbitRadius: 0,
      orbitSpeed: 0,
      mouseInfluence: 0.3,
      bobAmount: 0.018,
      bobSpeed: 0.32,
    };
  }

  update(t, dt) {
    super.update(t, dt);

    // Grace pulse (same idiom used elsewhere)
    const pulse = 1 + Math.sin(t * 2.4) * 0.12;
    this.grace.scale.setScalar(pulse);
    const baseGraceY = -0.6 + 0.7;
    this.grace.position.y = baseGraceY + Math.sin(t * 1.7) * 0.025;
    this.graceHalo.scale.set(0.96 + Math.sin(t * 2.1) * 0.06, 1.4 + Math.sin(t * 1.8) * 0.09, 1);
    this.graceHalo.material.opacity = 0.3 + Math.sin(t * 2.2) * 0.05;
    this.gracePool.scale.setScalar(0.86 + Math.sin(t * 1.25) * 0.035);
    this.gracePool.material.opacity = 0.14 + Math.sin(t * 1.5) * 0.025;
    this.graceLight.intensity = 2.45 + Math.sin(t * 2.2) * 0.32;

    for (const sprite of this.graceFlame.children) {
      const data = sprite.userData;
      const sway   = Math.sin(t * data.speed + data.phase);
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

    if (this.graceMotes) {
      const positions = this.graceMotes.geometry.attributes.position;
      for (let i = 0; i < this.graceMoteData.length; i++) {
        const mote = this.graceMoteData[i];
        mote.y += dt * mote.speed;
        if (mote.y > 2.15) {
          mote.y = Math.random() * 0.12;
          mote.radius = 0.04 + Math.pow(Math.random(), 1.9) * 0.34;
          mote.angle = Math.random() * Math.PI * 2;
        }

        const angle = mote.angle + t * mote.drift;
        const wobble = Math.sin(t * 1.7 + mote.wobble) * 0.028;
        const taper = 1 - THREE.MathUtils.smoothstep(mote.y, 1.45, 2.15) * 0.55;
        const riseFlutter = Math.sin(t * 3.1 + mote.phase) * 0.018;
        positions.setXYZ(
          i,
          Math.cos(angle) * (mote.radius + wobble) * taper,
          -0.6 + 0.28 + mote.y + riseFlutter,
          Math.sin(angle) * (mote.radius + wobble) * taper
        );
      }
      positions.needsUpdate = true;
      this.graceMotes.material.opacity = 0.82 + Math.sin(t * 2.4) * 0.08;
    }

    // Markers
    for (const marker of this.markers) {
      marker.update(t, this.hoveredMarker === marker, this.focusedMarker === marker);
    }

    // Hint
    if (this.hint) {
      const targetOpacity = this.focusedMarker ? 0 : (0.7 + Math.sin(t * 1.6) * 0.12);
      this.hint.material.opacity = THREE.MathUtils.lerp(
        this.hint.material.opacity,
        targetOpacity,
        0.06
      );
    }

    // Motes drift up
    if (this.motes) {
      const positions = this.motes.geometry.attributes.position;
      for (let i = 0; i < this.moteData.length; i++) {
        const m = this.moteData[i];
        let y = positions.getY(i) + m.speed * dt;
        if (y > 5.0) y = 0;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }

    this.#updateFocusFade(dt);

    if (this.focusProgress > 0.001 && this.cameraRig) {
      const camera = this.cameraRig.camera;
      const eased    = smootherStep(this.focusProgress);
      const lookEase = smootherStep(Math.max(0, this.focusProgress - 0.08) / 0.92);
      const rigPosition = camera.position.clone();
      camera.position.lerpVectors(rigPosition, this.focusCameraPosition, eased);
      this.currentLookTarget.lerpVectors(this.baseLookTarget, this.focusLookTarget, lookEase);
      camera.lookAt(this.currentLookTarget);
    } else {
      this.currentLookTarget.copy(this.baseLookTarget);
    }
  }

  getInteractiveObjects() {
    return this.markers.map((m) => m.hitbox).filter(Boolean);
  }

  handleSceneClick(hit) {
    const marker = this.#markerFromHit(hit);
    if (marker) this.#openReader(marker);
    else this.#closeReader();
  }

  handleSceneMiss() {
    this.#closeReader();
  }

  handleSceneHover(hit) {
    this.hoveredMarker = this.#markerFromHit(hit) ?? null;
    const renderer = document.querySelector('.three-renderer-canvas');
    if (renderer) renderer.style.cursor = this.hoveredMarker ? 'pointer' : '';
  }

  exit() {
    this.#closeReader();
    this.focusProgress = 0;
    const renderer = document.querySelector('.three-renderer-canvas');
    if (renderer) renderer.style.cursor = '';
    super.exit();
  }

  dispose() {
    this.stoneOverlay?.remove();
    super.dispose();
  }

  #markerFromHit(hit) {
    if (!hit) return null;
    let object = hit.object;
    while (object) {
      if (object.userData?.marker) return object.userData.marker;
      if (this.markers.includes(object)) return object;
      object = object.parent;
    }
    return null;
  }

  #openReader(marker) {
    this.focusedMarker = marker;
    this.hasOpenedOverlay = false;

    const markerPos = new THREE.Vector3();
    marker.getWorldPosition(markerPos);
    const toCamera = new THREE.Vector3()
      .subVectors(this.baseCameraPosition, markerPos)
      .setY(0)
      .normalize();
    this.focusCameraPosition.copy(markerPos).addScaledVector(toCamera, 2.0).setY(markerPos.y + 1.55);
    this.focusLookTarget.copy(markerPos).setY(markerPos.y + 0.95);
  }

  #closeReader() {
    this.focusedMarker = null;
    this.hasOpenedOverlay = false;
    if (this.stoneOverlay) {
      this.stoneOverlay.classList.remove('is-visible');
      this.stoneOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  #updateFocusFade(dt) {
    const target = this.focusedMarker ? 1 : 0;
    const speed  = this.focusedMarker ? 1.2 : 1.6;
    this.focusProgress = THREE.MathUtils.clamp(
      this.focusProgress + Math.sign(target - this.focusProgress) * dt * speed,
      0, 1
    );
    if (this.focusedMarker && !this.hasOpenedOverlay && this.focusProgress > 0.85) {
      this.hasOpenedOverlay = true;
      // Reuse stone-reader populator (year→eyebrow, title→title, body→body)
      populateStoneReader(this.stoneOverlay, {
        year: this.focusedMarker.userData.project.eyebrow,
        title: this.focusedMarker.userData.project.title,
        body: this.focusedMarker.userData.project.body,
      });
      this.stoneOverlay.classList.add('is-visible');
      this.stoneOverlay.setAttribute('aria-hidden', 'false');
    }
  }
}

// ── ProjectMarker ─────────────────────────────────────────────
// A tall white-marble tablet on a stepped plinth. Carved face
// holds the project title + eyebrow; whole thing tilts very
// slightly forward so the inscription faces the camera.
class ProjectMarker extends THREE.Group {
  constructor(project, marbleMaterial, seed) {
    super();
    this.project = project;
    this.userData.project = project;
    this.userData.marker = this;

    // Stepped plinth
    const plinthLow = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.18, 0.78),
      marbleMaterial
    );
    plinthLow.position.y = 0.09;
    plinthLow.castShadow = true;
    plinthLow.receiveShadow = true;
    this.add(plinthLow);

    const plinthHigh = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 0.14, 0.66),
      marbleMaterial
    );
    plinthHigh.position.y = 0.18 + 0.07;
    plinthHigh.castShadow = true;
    plinthHigh.receiveShadow = true;
    this.add(plinthHigh);

    // Tablet shaft — tall flat slab
    const tabletWidth = 0.96;
    const tabletHeight = 1.7;
    const tabletDepth = 0.18;
    const tablet = new THREE.Mesh(
      new THREE.BoxGeometry(tabletWidth, tabletHeight, tabletDepth),
      marbleMaterial
    );
    tablet.position.y = 0.18 + 0.14 + tabletHeight / 2;
    tablet.castShadow = true;
    tablet.receiveShadow = true;
    this.add(tablet);
    this.tablet = tablet;

    // Inscribed face — emissive plane mounted on the front of the tablet
    const inscriptionTex = createProjectPlaqueTexture(project);
    const inscriptionMat = new THREE.MeshBasicMaterial({
      map: inscriptionTex,
      transparent: true,
      opacity: 1,
      alphaTest: 0.025,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const inscriptionPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(tabletWidth * 0.9, tabletHeight * 0.88),
      inscriptionMat
    );
    inscriptionPlane.position.set(0, tablet.position.y, tabletDepth / 2 + 0.018);
    inscriptionPlane.renderOrder = 18;
    this.add(inscriptionPlane);
    this.inscriptionMaterial = inscriptionMat;

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(tabletWidth * 1.12, 0.16, tabletDepth * 1.65),
      marbleMaterial
    );
    cap.position.y = tablet.position.y + tabletHeight / 2 + 0.08;
    cap.rotation.z = (seed % 7 - 3) * 0.006;
    cap.castShadow = true;
    cap.receiveShadow = true;
    this.add(cap);

    const topLip = new THREE.Mesh(
      new THREE.BoxGeometry(tabletWidth * 0.92, 0.055, tabletDepth * 1.32),
      marbleMaterial
    );
    topLip.position.y = cap.position.y + 0.105;
    topLip.position.x = ((seed % 5) - 2) * 0.012;
    topLip.rotation.z = -cap.rotation.z * 0.6;
    topLip.castShadow = true;
    topLip.receiveShadow = true;
    this.add(topLip);

    // Generous invisible hitbox around the whole marker
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.6, 1.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitbox.position.y = 1.1;
    hitbox.userData.marker = this;
    this.add(hitbox);
    this.hitbox = hitbox;
  }

  update(t, isHovered, isFocused) {
    this.inscriptionMaterial.opacity = 1;
  }
}

const skillSwordPlacements = [
  // Back row planted behind the grace
  { name: 'Frontend Craft',     x: -2.85, z: -2.85, rotY: -0.05, rotZ: 0.028 },
  { name: 'Interaction Design', x: -1.40, z: -2.65, rotY: -0.02, rotZ: -0.02 },
  { name: 'Visual Systems',     x:  1.40, z: -2.65, rotY:  0.02, rotZ: 0.018 },
  { name: 'Automation',         x:  2.85, z: -2.85, rotY:  0.05, rotZ: -0.028 },
  // Side flanks turned toward the camera
  { name: 'Prototyping',        x: -4.25, z:  0.45, rotY:  0.62, rotZ: 0.035 },
  { name: 'Animation',          x:  4.25, z:  0.45, rotY: -0.62, rotZ: -0.035 },
];

class SkillsScene extends RegionScene {
  group = new THREE.Group();

  grace = null;
  graceLight = null;
  graceHalo = null;
  graceFlame = null;
  gracePool = null;

  swords = [];
  arrows = [];

  motes = null;
  moteData = [];

  init() {
    this.scene.background = createSkillsNightSkyTexture();
    this.scene.fog = new THREE.FogExp2(0x06070d, 0.082);
    this.scene.add(this.group);

    this.addLighting();
    this.addGround();
    this.addRubble();
    this.addRuinSilhouettes();
    this.addSiteOfGrace();
    this.addSwordRow();
    this.addFlameArrows();
    this.addParticles();
  }

  addLighting() {
    // Very dim ambient — the arrows and grace are the dominant light
    const ambient = new THREE.AmbientLight(0x14182a, 0.22);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x2c3050, 0x05060a, 0.32);
    this.scene.add(hemi);

    // A faint warm fill from the centered grace toward camera
    const graceFill = new THREE.PointLight(0xffb866, 1.4, 5.5, 1.6);
    graceFill.position.set(0, 0.6, 0.8);
    this.scene.add(graceFill);
  }

  addGround() {
    const geometry = new THREE.PlaneGeometry(58, 58, 130, 130);
    const position = geometry.attributes.position;
    const random = seededRandom(13771);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const broad =
        Math.sin(x * 0.21) * 0.07 +
        Math.cos(y * 0.18) * 0.06 +
        Math.sin((x + y) * 0.07) * 0.05;
      const grit = (random() - 0.5) * 0.045;
      const falloff = Math.min(1, Math.hypot(x, y) / 22);
      position.setZ(i, (broad + grit) * (0.55 + falloff * 0.55));
    }
    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);

    const textures = createSkillsGroundTextureSet();
    const ground = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x161821,
        map: textures.color,
        roughnessMap: textures.roughness,
        bumpMap: textures.bump,
        bumpScale: 0.085,
        roughness: 0.97,
        metalness: 0.04,
      })
    );
    ground.position.y = -0.98;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  addRubble() {
    // Battlefield debris scattered around the grace — fallen helms, shields,
    // and broken weapons left by previous Tarnished.
    const debris = [
      { type: 'helm',   x: -2.05, z: 1.0,  rotY: 0.6,  tip: 0.6,  scale: 0.9, seed: 11 },
      { type: 'helm',   x: 2.15,  z: 0.85, rotY: -0.3, tip: -0.4, scale: 0.95, seed: 23 },
      { type: 'shield', x: -2.85, z: -0.4, rotY: 0.4,  lean: 0.95, scale: 1.0, seed: 47 },
      { type: 'shield', x: 2.95,  z: -0.5, rotY: -0.5, lean: 0.7,  scale: 0.95, seed: 61 },
      { type: 'helm',   x: -3.7,  z: -2.5, rotY: 1.2,  tip: 0.85, scale: 0.85, seed: 79 },
      { type: 'helm',   x: 3.6,   z: -2.6, rotY: -0.9, tip: -0.7, scale: 0.88, seed: 97 },
      { type: 'sword',  x: -1.4,  z: 1.85, rotY: 1.15, scale: 1.0, seed: 113 },
      { type: 'sword',  x: 1.5,   z: 1.95, rotY: -0.55, scale: 0.95, seed: 131 },
      { type: 'spear',  x: -0.55, z: -1.95, rotY: 0.3,  scale: 1.05, seed: 149 },
      { type: 'spear',  x: 0.7,   z: 2.4,  rotY: -1.2, scale: 1.0, seed: 167 },
      { type: 'helm',   x: 0.05,  z: -3.4, rotY: 2.1,  tip: 0.45, scale: 0.85, seed: 181 },
      { type: 'shield', x: -4.4,  z: -1.6, rotY: 0.85, lean: 1.0, scale: 1.05, seed: 197 },
      { type: 'sword',  x: 4.4,   z: -1.5, rotY: -0.6, scale: 1.05, seed: 211 },
    ];

    for (const d of debris) {
      let item;
      if (d.type === 'helm') item = createKnightHelm(d.seed);
      else if (d.type === 'shield') item = createBattleShield(d.seed);
      else if (d.type === 'sword') item = createFallenSword(d.seed);
      else item = createFallenSpear(d.seed);

      item.position.set(d.x, -0.96, d.z);
      item.rotation.y = d.rotY ?? 0;
      if (d.tip !== undefined) {
        // helms are tipped on their side
        item.rotation.z = d.tip;
        item.position.y = -0.86 + (Math.abs(d.tip) > 0.3 ? -0.06 : 0);
      }
      if (d.lean !== undefined) {
        // shields lie on the ground at a slight tilt
        item.rotation.x = -Math.PI / 2 + (1 - d.lean) * 0.8;
        item.position.y = -0.95;
      }
      item.scale.setScalar(d.scale);
      this.group.add(item);
    }

    // Broken column fragments — short cylindrical chunks lying around
    const columnMaterial = createMarbleMaterial({
      tint: 0x6f6a5e,
      veinStrength: 0.55,
      speckStrength: 0.5,
    });
    columnMaterial.color = new THREE.Color(0x55514a);
    columnMaterial.roughness = 0.95;

    const fragments = [
      [-3.0, -0.78, -1.2, 0.62, Math.PI / 2.05, 0.18],
      [3.1, -0.78, -1.4, 0.58, Math.PI / 2.0, -0.22],
      [-1.9, -0.82, -3.6, 0.5, Math.PI / 2.2, 0.6],
      [2.0, -0.82, -3.7, 0.52, Math.PI / 2.3, -0.5],
      [-4.4, -0.74, 0.0, 0.78, Math.PI / 2.0, 0.05],
    ];
    for (const [x, y, z, len, rot, yaw] of fragments) {
      const chunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.24, len, 18, 1),
        columnMaterial
      );
      chunk.position.set(x, y, z);
      chunk.rotation.set(rot, yaw, 0);
      chunk.castShadow = true;
      chunk.receiveShadow = true;
      this.group.add(chunk);
    }
  }

  addRuinSilhouettes() {
    // A few standing fractured columns far back to break the horizon
    const material = createMarbleMaterial({
      tint: 0x4f4a40,
      veinStrength: 0.6,
      speckStrength: 0.55,
    });
    material.color = new THREE.Color(0x35332d);
    material.roughness = 0.96;

    const standing = [
      [-5.4, -0.95, -5.0, 1.85, 0.34],
      [5.3, -0.95, -5.2, 2.05, 0.38],
      [-3.4, -0.95, -6.4, 1.45, 0.30],
      [3.2, -0.95, -6.6, 1.6, 0.32],
      [0.2, -0.95, -7.0, 2.4, 0.42],
    ];
    for (const [x, y, z, height, radius] of standing) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.06, height, 22, 1),
        material
      );
      col.position.set(x, y + height / 2, z);
      col.rotation.z = (Math.sin(x * 0.6) * 0.04);
      col.rotation.y = Math.cos(z * 0.4) * 0.2;
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);
    }
  }

  addSiteOfGrace() {
    const cx = 0;
    const cy = -0.15;
    const cz = 0;

    this.grace = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xfff2a6,
        transparent: true,
        opacity: 1,
      })
    );
    this.grace.position.set(cx, cy, cz);
    this.group.add(this.grace);

    this.graceLight = new THREE.PointLight(0xf0d060, 3.6, 9);
    this.graceLight.position.set(cx, cy + 0.2, cz);
    this.group.add(this.graceLight);

    this.gracePool = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 64),
      new THREE.MeshBasicMaterial({
        map: createLightPoolTexture(),
        color: 0xf0d060,
        transparent: true,
        opacity: 0.66,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.gracePool.rotation.x = -Math.PI / 2;
    this.gracePool.position.set(cx, -0.93, cz);
    this.group.add(this.gracePool);

    this.graceHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialGlowTexture('#f0d060'),
        color: 0xf0d060,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.graceHalo.position.set(cx, cy + 0.18, cz);
    this.graceHalo.scale.set(1.05, 1.55, 1);
    this.group.add(this.graceHalo);

    this.graceFlame = new THREE.Group();
    this.graceFlame.position.set(cx, cy + 0.04, cz);
    const flameTexture = createGraceFlameTexture();
    const wisps = [
      { x: 0, y: 0.18, z: 0, sx: 0.42, sy: 1.95, opacity: 0.95, phase: 0, speed: 1.2 },
      { x: -0.04, y: 0.14, z: 0.03, sx: 0.3, sy: 1.65, opacity: 0.62, phase: 1.7, speed: 1.6 },
      { x: 0.05, y: 0.1, z: -0.02, sx: 0.24, sy: 1.38, opacity: 0.48, phase: 3.1, speed: 1.45 },
      { x: 0.02, y: 0.44, z: 0.01, sx: 0.18, sy: 0.92, opacity: 0.52, phase: 4.4, speed: 1.9 },
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

  addSwordRow() {
    for (let i = 0; i < skillSwordPlacements.length; i++) {
      const p = skillSwordPlacements[i];
      const sword = createSkillSword(p.name, i * 13 + 7);
      sword.position.set(p.x, -1.02, p.z);
      sword.rotation.y = p.rotY ?? 0;
      sword.rotation.z = p.rotZ ?? 0;
      sword.castShadow = true;

      this.swords.push(sword);
      this.group.add(sword);
    }
  }

  addFlameArrows() {
    // Flame-tipped arrows planted around the scene as primary light sources
    const configs = [
      { x: -1.7, z: 1.05, yaw: 0.55, lean: 0.32 },
      { x: 1.75, z: 1.0, yaw: -0.5, lean: 0.34 },
      { x: -3.05, z: -0.45, yaw: 0.75, lean: 0.42 },
      { x: 3.1, z: -0.5, yaw: -0.7, lean: 0.42 },
      { x: -1.0, z: -1.45, yaw: 0.25, lean: 0.18 },
      { x: 1.05, z: -1.5, yaw: -0.25, lean: 0.18 },
      { x: -2.4, z: -4.4, yaw: 0.6, lean: 0.5 },
      { x: 2.5, z: -4.4, yaw: -0.6, lean: 0.5 },
    ];

    for (const cfg of configs) {
      const arrow = createFlameArrow(cfg.yaw, cfg.lean);
      arrow.group.position.set(cfg.x, -1.0, cfg.z);
      this.arrows.push(arrow);
      this.group.add(arrow.group);
    }
  }

  addParticles() {
    this.motes = new THREE.Group();
    const moteGeometry = new THREE.SphereGeometry(0.02, 8, 6);
    const moteMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc878,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < 38; i++) {
      const mote = new THREE.Mesh(moteGeometry, moteMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 4.8;
      const baseX = Math.cos(angle) * radius;
      const baseZ = Math.sin(angle) * radius;
      const baseY = -0.55 + Math.random() * 1.4;
      mote.position.set(baseX, baseY, baseZ);
      mote.userData = {
        baseX,
        baseY,
        baseZ,
        phase: Math.random() * Math.PI * 2,
        speed: 0.18 + Math.random() * 0.24,
        sway: 0.08 + Math.random() * 0.14,
      };
      this.motes.add(mote);
    }
    this.group.add(this.motes);
  }

  getCameraConfig() {
    return {
      position: [0, 1.55, 6.2],
      target: [0, 0.05, -0.4],
      orbitRadius: 0.18,
      orbitSpeed: 0.12,
      bobAmount: 0.05,
      bobSpeed: 0.42,
      mouseInfluence: 0.85,
    };
  }

  update(t, dt) {
    super.update(t, dt);

    if (this.graceFlame) {
      for (const sprite of this.graceFlame.children) {
        const data = sprite.userData;
        const wave = Math.sin(t * data.speed + data.phase);
        sprite.position.x = data.baseX + Math.sin(t * 1.4 + data.phase) * 0.012;
        sprite.position.y = data.baseY + Math.abs(wave) * 0.04;
        sprite.scale.x = data.baseScaleX * (1 + Math.sin(t * 2.6 + data.phase) * 0.06);
        sprite.scale.y = data.baseScaleY * (1 + wave * 0.08);
        sprite.material.opacity = data.baseOpacity * (0.84 + 0.16 * Math.sin(t * 3.2 + data.phase));
      }
    }
    if (this.graceLight) {
      this.graceLight.intensity = 3.2 + Math.sin(t * 2.4) * 0.55;
    }
    if (this.graceHalo) {
      const pulse = 1 + Math.sin(t * 1.7) * 0.04;
      this.graceHalo.scale.set(1.05 * pulse, 1.55 * pulse, 1);
    }
    if (this.gracePool) {
      this.gracePool.material.opacity = 0.6 + Math.sin(t * 1.9) * 0.06;
    }

    for (const arrow of this.arrows) arrow.update(t);
    for (const sword of this.swords) sword.userData.update?.(t);

    if (this.motes) {
      for (const mote of this.motes.children) {
        const d = mote.userData;
        mote.position.x = d.baseX + Math.sin(t * 0.6 + d.phase) * d.sway;
        mote.position.z = d.baseZ + Math.cos(t * 0.55 + d.phase * 1.3) * d.sway;
        mote.position.y = d.baseY + (((t * d.speed + d.phase) % 2.6) - 1.3) * 0.6;
      }
    }
  }
}

const contactDetails = {
  title: 'Send Word',
  metadata: 'Roundtable Hold',
  intro: 'Messages, collaborations, and quests welcome. The fastest way to reach me is below — every link opens in a new window.',
  links: [
    { label: 'Email',    value: 'isaachu2004@gmail.com',     href: 'mailto:isaachu2004@gmail.com' },
    { label: 'GitHub',   value: 'github.com/IHu04',           href: 'https://github.com/IHu04' },
    { label: 'LinkedIn', value: 'linkedin.com/in/isaac-hu',   href: 'https://www.linkedin.com/in/isaac-hu' },
  ],
};

class ContactScene extends RegionScene {
  group = new THREE.Group();

  grace = null;
  graceLight = null;
  graceHalo = null;
  graceFlame = null;
  gracePool = null;

  signGroup = null;
  signClickable = null;
  signHint = null;
  signOverlay = null;
  isSignFocused = false;
  signFocusProgress = 0;
  hasOpenedSignOverlay = false;

  torches = [];
  motes = null;

  init() {
    this.scene.background = createCastleEveningSkyTexture();
    this.scene.fog = new THREE.FogExp2(0x0e1726, 0.04);
    this.scene.add(this.group);

    this.addLighting();
    this.addFloor();
    this.addCurvedWall();
    this.addSiteOfGrace();
    this.addWoodSign();
    this.addParticles();

    this.signOverlay = createContactReaderOverlay(contactDetails, () => this.#closeSignOverlay());
  }

  addLighting() {
    // Cool blue ambient — late twilight
    const ambient = new THREE.AmbientLight(0x1c2740, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x5e80ad, 0x10131c, 0.95);
    this.scene.add(hemi);

    // Moonlight from above-left
    const moon = new THREE.DirectionalLight(0xa8c0e8, 1.45);
    moon.position.set(-4.5, 9, 3.2);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -10;
    moon.shadow.camera.right = 10;
    moon.shadow.camera.top = 10;
    moon.shadow.camera.bottom = -10;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 30;
    moon.shadow.bias = -0.0002;
    moon.shadow.normalBias = 0.02;
    this.scene.add(moon);

    // A soft cool fill from behind to silhouette the grace + sign
    const rim = new THREE.DirectionalLight(0x4a78a8, 0.42);
    rim.position.set(2.5, 5, -6);
    this.scene.add(rim);
  }

  addFloor() {
    const geometry = new THREE.PlaneGeometry(34, 34, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    const textures = createCastleFloorTextureSet();
    const floor = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x6a7280,
        map: textures.color,
        roughnessMap: textures.roughness,
        bumpMap: textures.bump,
        bumpScale: 0.08,
        roughness: 0.94,
        metalness: 0.04,
      })
    );
    floor.position.y = -0.95;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  addCurvedWall() {
    // A fully enclosed castle hall — the camera stands inside the cylinder.
    // The wall is tall enough that it fills the upper view frame even when
    // looking up moderately, with crenellated battlements at the top.
    const wallRadius = 8.4;
    const wallHeight = 9.0;
    const floorY = -0.95;
    const stone = createCastleWallTextureSet();
    stone.color.repeat.set(14, 2.4);
    stone.roughness.repeat.set(14, 2.4);
    stone.bump.repeat.set(14, 2.4);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x6f7986,
      map: stone.color,
      roughnessMap: stone.roughness,
      bumpMap: stone.bump,
      bumpScale: 0.2,
      roughness: 0.96,
      metalness: 0.05,
      side: THREE.BackSide,
    });

    const wallGeom = new THREE.CylinderGeometry(
      wallRadius, wallRadius, wallHeight,
      120, 1, true
    );
    const wall = new THREE.Mesh(wallGeom, wallMaterial);
    wall.position.y = floorY + wallHeight / 2;
    wall.receiveShadow = true;
    this.group.add(wall);

    const trim = createCastleTrimTextureSet();
    trim.color.repeat.set(14, 1);
    trim.roughness.repeat.set(14, 1);
    trim.bump.repeat.set(14, 1);

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x565d68,
      map: trim.color,
      roughnessMap: trim.roughness,
      bumpMap: trim.bump,
      bumpScale: 0.14,
      roughness: 0.96,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    // Heavy plinth around the base
    const plinthGeom = new THREE.CylinderGeometry(
      wallRadius + 0.22, wallRadius + 0.26, 0.78,
      120, 1, true
    );
    const plinth = new THREE.Mesh(plinthGeom, trimMaterial);
    plinth.position.y = floorY + 0.39;
    plinth.receiveShadow = true;
    plinth.material.side = THREE.DoubleSide;
    this.group.add(plinth);
    // Inner-facing variant so the plinth reads from inside the room
    const plinthInner = new THREE.Mesh(
      new THREE.CylinderGeometry(wallRadius - 0.04, wallRadius - 0.02, 0.78, 120, 1, true),
      trimMaterial
    );
    plinthInner.position.y = floorY + 0.39;
    plinthInner.material.side = THREE.BackSide;
    this.group.add(plinthInner);

    // Mid-wall string course (chair-rail band)
    const railGeom = new THREE.CylinderGeometry(
      wallRadius - 0.04, wallRadius - 0.04, 0.22,
      120, 1, true
    );
    const rail = new THREE.Mesh(railGeom, trimMaterial);
    rail.position.y = floorY + 2.55;
    rail.material.side = THREE.BackSide;
    this.group.add(rail);

    // Top cornice that the merlons sit on
    const corniceGeom = new THREE.CylinderGeometry(
      wallRadius - 0.04, wallRadius - 0.04, 0.42,
      120, 1, true
    );
    const cornice = new THREE.Mesh(corniceGeom, trimMaterial);
    cornice.position.y = floorY + wallHeight - 0.21;
    cornice.material.side = THREE.BackSide;
    this.group.add(cornice);

    // Vertical buttresses jutting into the room — 8 evenly spaced columns
    const buttressCount = 8;
    const buttressInset = 0.34;
    const buttressInnerRadius = wallRadius - buttressInset;
    for (let i = 0; i < buttressCount; i++) {
      const angle = (i / buttressCount) * Math.PI * 2;
      const x = Math.sin(angle) * buttressInnerRadius;
      const z = Math.cos(angle) * buttressInnerRadius;

      const buttress = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, wallHeight - 0.6, 0.55),
        trimMaterial
      );
      buttress.position.set(x, floorY + (wallHeight - 0.6) / 2, z);
      buttress.lookAt(0, buttress.position.y, 0);
      buttress.castShadow = true;
      buttress.receiveShadow = true;
      this.group.add(buttress);

      // Capital block at the top of each buttress
      const capital = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.32, 0.7),
        trimMaterial
      );
      capital.position.set(x, floorY + wallHeight - 0.78, z);
      capital.lookAt(0, capital.position.y, 0);
      capital.castShadow = true;
      this.group.add(capital);

      // Base block
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.4, 0.72),
        trimMaterial
      );
      base.position.set(x, floorY + 0.2, z);
      base.lookAt(0, base.position.y, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      this.group.add(base);
    }

    // Crenellated battlements (merlons) along the top of the wall
    const merlonCount = 56;
    const merlonInnerRadius = wallRadius - 0.02;
    for (let i = 0; i < merlonCount; i++) {
      if (i % 2 === 1) continue; // alternate gaps create the crenellation
      const angle = (i / merlonCount) * Math.PI * 2;
      const x = Math.sin(angle) * merlonInnerRadius;
      const z = Math.cos(angle) * merlonInnerRadius;
      const merlon = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.7, 0.34),
        trimMaterial
      );
      merlon.position.set(x, floorY + wallHeight + 0.35, z);
      merlon.lookAt(0, merlon.position.y, 0);
      merlon.castShadow = true;
      this.group.add(merlon);
    }

    // Recessed window niches with a faint cool glow — suggestion of moonlight
    // spilling in from outside.
    const windowAngles = [Math.PI * 0.0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    for (const angle of windowAngles) {
      const niche = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 1.6),
        new THREE.MeshBasicMaterial({
          color: 0x586f99,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      niche.position.set(
        Math.sin(angle) * (wallRadius - 0.05),
        floorY + 4.2,
        Math.cos(angle) * (wallRadius - 0.05)
      );
      niche.lookAt(0, niche.position.y, 0);
      this.group.add(niche);

      // Subtle volumetric glow extending into the room from the niche
      const beam = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createRadialGlowTexture('rgba(140, 180, 230, 0.85)'),
          color: 0x8fb6e2,
          transparent: true,
          opacity: 0.42,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      beam.position.copy(niche.position);
      beam.scale.set(2.2, 3.2, 1);
      this.group.add(beam);
    }

    // Wall-mounted torches at four points to break up the cool blue with
    // pools of warm flame light
    const torchAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    for (const angle of torchAngles) {
      const torchInnerRadius = wallRadius - 0.16;
      const x = Math.sin(angle) * torchInnerRadius;
      const z = Math.cos(angle) * torchInnerRadius;
      const torch = createWallTorch();
      torch.group.position.set(x, floorY + 3.1, z);
      torch.group.lookAt(0, torch.group.position.y, 0);
      this.group.add(torch.group);
      this.torches.push(torch);
    }
  }

  addSiteOfGrace() {
    const cx = 0;
    const cy = -0.15;
    const cz = 0;

    this.grace = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff2a6, transparent: true, opacity: 1 })
    );
    this.grace.position.set(cx, cy, cz);
    this.group.add(this.grace);

    this.graceLight = new THREE.PointLight(0xf0d060, 3.6, 9);
    this.graceLight.position.set(cx, cy + 0.2, cz);
    this.group.add(this.graceLight);

    this.gracePool = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 64),
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
    this.gracePool.position.set(cx, -0.93, cz);
    this.group.add(this.gracePool);

    this.graceHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialGlowTexture('#f0d060'),
        color: 0xf0d060,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.graceHalo.position.set(cx, cy + 0.18, cz);
    this.graceHalo.scale.set(1.05, 1.55, 1);
    this.group.add(this.graceHalo);

    this.graceFlame = new THREE.Group();
    this.graceFlame.position.set(cx, cy + 0.04, cz);
    const flameTexture = createGraceFlameTexture();
    const wisps = [
      { x: 0, y: 0.18, z: 0, sx: 0.42, sy: 1.95, opacity: 0.95, phase: 0, speed: 1.2 },
      { x: -0.04, y: 0.14, z: 0.03, sx: 0.3, sy: 1.65, opacity: 0.62, phase: 1.7, speed: 1.6 },
      { x: 0.05, y: 0.1, z: -0.02, sx: 0.24, sy: 1.38, opacity: 0.48, phase: 3.1, speed: 1.45 },
      { x: 0.02, y: 0.44, z: 0.01, sx: 0.18, sy: 0.92, opacity: 0.52, phase: 4.4, speed: 1.9 },
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

  addWoodSign() {
    this.signGroup = createWoodSign();
    this.signGroup.position.set(1.7, -0.95, 0.55);
    this.signGroup.rotation.y = -0.42;
    this.group.add(this.signGroup);

    // Hitbox covering the sign board so raycasts have a clean surface
    this.signClickable = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.95, 0.18),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    this.signClickable.position.set(0, 1.18, 0);
    this.signClickable.userData.clickTarget = 'sign';
    this.signGroup.add(this.signClickable);

    // Floating hint — centered directly above the sign post
    this.signHint = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createHintTexture('Click sign to send word'),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        depthTest: false,
      })
    );
    this.signHint.renderOrder = 38;
    this.signHint.position.set(
      this.signGroup.position.x,
      this.signGroup.position.y + 2.6,
      this.signGroup.position.z
    );
    this.signHint.scale.set(1.7, 0.34, 1);
    this.group.add(this.signHint);
  }

  addParticles() {
    this.motes = new THREE.Group();
    const moteGeom = new THREE.SphereGeometry(0.018, 6, 6);
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xb6d2ee,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 30; i++) {
      const mote = new THREE.Mesh(moteGeom, moteMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.7 + Math.random() * 4.0;
      const baseY = -0.4 + Math.random() * 2.6;
      const baseX = Math.cos(angle) * radius;
      const baseZ = Math.sin(angle) * radius;
      mote.position.set(baseX, baseY, baseZ);
      mote.userData = {
        baseX,
        baseY,
        baseZ,
        phase: Math.random() * Math.PI * 2,
        speed: 0.14 + Math.random() * 0.18,
        sway: 0.08 + Math.random() * 0.14,
      };
      this.motes.add(mote);
    }
    this.group.add(this.motes);
  }

  getCameraConfig() {
    return {
      position: [0, 1.45, 5.5],
      target: [0, 0.18, -0.4],
      orbitRadius: 0.16,
      orbitSpeed: 0.13,
      bobAmount: 0.04,
      bobSpeed: 0.42,
      mouseInfluence: 0.6,
    };
  }

  getInteractiveObjects() {
    return [this.signClickable, this.signGroup].filter(Boolean);
  }

  handleSceneClick(hit) {
    if (this.#isSignHit(hit)) this.#openSignReader();
  }

  handleSceneMiss() {
    if (!this.signOverlay?.classList.contains('is-visible')) {
      this.#closeSignOverlay();
    }
  }

  handleSceneHover(hit) {
    if (!this.signHint || this.isSignFocused) return;
    const isSignHit = this.#isSignHit(hit);
    this.signHint.scale.set(isSignHit ? 1.84 : 1.7, isSignHit ? 0.38 : 0.34, 1);
  }

  #isSignHit(hit) {
    if (!hit) return false;
    let obj = hit.object;
    while (obj) {
      if (obj === this.signGroup || obj === this.signClickable) return true;
      obj = obj.parent;
    }
    return false;
  }

  #openSignReader() {
    this.isSignFocused = true;
    this.hasOpenedSignOverlay = false;
  }

  #closeSignOverlay() {
    this.isSignFocused = false;
    this.hasOpenedSignOverlay = false;
    this.signOverlay?.classList.remove('is-visible');
    this.signOverlay?.setAttribute('aria-hidden', 'true');
  }

  update(t, dt) {
    super.update(t, dt);

    // Grace flame animation
    if (this.graceFlame) {
      for (const sprite of this.graceFlame.children) {
        const data = sprite.userData;
        const wave = Math.sin(t * data.speed + data.phase);
        sprite.position.x = data.baseX + Math.sin(t * 1.4 + data.phase) * 0.012;
        sprite.position.y = data.baseY + Math.abs(wave) * 0.04;
        sprite.scale.x = data.baseScaleX * (1 + Math.sin(t * 2.6 + data.phase) * 0.06);
        sprite.scale.y = data.baseScaleY * (1 + wave * 0.08);
        sprite.material.opacity = data.baseOpacity * (0.84 + 0.16 * Math.sin(t * 3.2 + data.phase));
      }
    }
    if (this.graceLight) {
      this.graceLight.intensity = 3.2 + Math.sin(t * 2.4) * 0.55;
    }
    if (this.graceHalo) {
      const pulse = 1 + Math.sin(t * 1.7) * 0.04;
      this.graceHalo.scale.set(1.05 * pulse, 1.55 * pulse, 1);
    }
    if (this.gracePool) {
      this.gracePool.material.opacity = 0.6 + Math.sin(t * 1.9) * 0.06;
    }

    // Sign hint pulse
    if (this.signHint && !this.isSignFocused) {
      this.signHint.material.opacity = 0.7 + Math.sin(t * 1.6) * 0.16;
    }

    // Sign focus / overlay timing — slight delay before showing the panel
    const target = this.isSignFocused ? 1 : 0;
    const speed = this.isSignFocused ? 1.18 : 1.65;
    this.signFocusProgress = THREE.MathUtils.clamp(
      this.signFocusProgress + Math.sign(target - this.signFocusProgress) * dt * speed,
      0,
      1
    );
    if (this.isSignFocused && !this.hasOpenedSignOverlay && this.signFocusProgress > 0.5) {
      this.hasOpenedSignOverlay = true;
      this.signOverlay?.classList.add('is-visible');
      this.signOverlay?.setAttribute('aria-hidden', 'false');
    }

    // Wall torch flicker
    for (const torch of this.torches) torch.update(t);

    // Ambient motes
    if (this.motes) {
      for (const mote of this.motes.children) {
        const d = mote.userData;
        mote.position.x = d.baseX + Math.sin(t * 0.6 + d.phase) * d.sway;
        mote.position.z = d.baseZ + Math.cos(t * 0.55 + d.phase * 1.3) * d.sway;
        mote.position.y = d.baseY + (((t * d.speed + d.phase) % 2.6) - 1.3) * 0.4;
      }
    }
  }

  exit() {
    this.#closeSignOverlay();
    this.signFocusProgress = 0;
    super.exit();
  }

  dispose() {
    this.signOverlay?.remove();
    super.dispose();
  }
}

// ── Experience timeline content ───────────────────────────────
// Replace these placeholders with real history; structure is preserved.
const experienceTimeline = [
  {
    year: '2024',
    title: 'Most Recent Role',
    body: 'A short paragraph describing the work, the problem space, and what was learned. Update this stone with real details — the carving will follow.',
  },
  {
    year: '2023',
    title: 'Penultimate Chapter',
    body: 'Each stone holds a season of work. Replace this with what you actually did, who you did it with, and why it mattered.',
  },
  {
    year: '2022',
    title: 'A Founding Effort',
    body: 'A side project or company-shaping initiative. Describe the constraints, the artifact, the outcome — the kind of details a recruiter or collaborator would want.',
  },
  {
    year: '2021',
    title: 'Earlier Campaign',
    body: 'Lessons compounded here. Replace with the actual employer, role, scope of impact, and the technical surface you owned.',
  },
  {
    year: '2020',
    title: 'First Major Post',
    body: 'The first real engineering role, or the formative project that set the direction. Keep this body 2–4 sentences for legibility on the stone overlay.',
  },
  {
    year: '2018',
    title: 'Origin · Internship',
    body: 'Where it began — the internship, lab, or solo build that started the path. Brief, evocative, honest.',
  },
];

class ExperienceScene extends RegionScene {
  group = new THREE.Group();

  // Site of Grace (copied wholesale from LimgraveScene)
  grace = null;
  graceLight = null;
  graceHalo = null;
  graceFlame = null;
  gracePool = null;

  // Underwater environment
  seafloor = null;
  causticsMaterial = null;
  godRayGroup = new THREE.Group();
  godRays = [];
  bubbles = null;
  bubbleData = [];
  motes = null;
  moteData = [];
  graceMotes = null;
  graceMoteData = [];

  // Timeline stones
  stones = [];          // Array<TimelineStone>
  hoveredStone = null;
  focusedStone = null;
  focusProgress = 0;
  hasOpenedOverlay = false;

  // Camera focus
  baseCameraPosition = new THREE.Vector3(0, 2.85, 8.0);
  baseLookTarget = new THREE.Vector3(0, 0.05, 0.6);
  currentLookTarget = new THREE.Vector3(0, 0.05, 0.6);
  focusCameraPosition = new THREE.Vector3();
  focusLookTarget = new THREE.Vector3();

  stoneOverlay = null;

  init() {
    this.scene.background = createUnderwaterBackgroundTexture();
    this.scene.fog = new THREE.FogExp2(0x06202c, 0.058);
    this.scene.add(this.group);
    this.group.add(this.godRayGroup);

    this.addLighting();
    this.addSeafloor();
    this.addSiteOfGrace();
    this.addAmbientRocks();
    this.addTimelineStones();
    this.addGodRays();
    this.addBubbles();
    this.addParticles();
    this.addHint();

    this.stoneOverlay = createStoneReaderOverlay(() => this.#closeStoneReader());
  }

  // Floating hint that fades when the user starts interacting
  addHint() {
    this.hint = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createHintTexture('Click a stone to read'),
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      })
    );
    this.hint.position.set(0, 3.05, 3.0);
    this.hint.scale.set(1.75, 0.35, 1);
    this.group.add(this.hint);
  }

  // ── Lighting (filtered submarine sun + cool ambient) ────────
  addLighting() {
    const ambient = new THREE.AmbientLight(0x2a5566, 0.72);
    this.scene.add(ambient);

    // Filtered sunlight from above — pale teal
    const sun = new THREE.DirectionalLight(0x9bcfe2, 2.05);
    sun.position.set(1.2, 14, 1.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 28;
    sun.shadow.bias = -0.00022;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    // Hemisphere — deep blue floor / brighter teal sky
    const hemi = new THREE.HemisphereLight(0x6ba6c0, 0x081820, 0.92);
    this.scene.add(hemi);

    // Cool fill from behind to silhouette stones
    const rim = new THREE.DirectionalLight(0x4a82a0, 0.65);
    rim.position.set(-3, 4, -6);
    this.scene.add(rim);

    // Warm bounce from the Grace toward the camera-facing front of stones
    const graceFill = new THREE.PointLight(0xf0c878, 1.2, 6);
    graceFill.position.set(0, 1.2, 1.6);
    this.scene.add(graceFill);
  }

  // ── Seafloor — sand + animated caustic overlay ──────────────
  addSeafloor() {
    const geometry = new THREE.PlaneGeometry(50, 50, 140, 140);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const ripple =
        Math.sin(x * 0.32) * 0.06 +
        Math.cos(y * 0.27) * 0.05 +
        Math.sin((x + y) * 0.12) * 0.04;
      const dune = Math.sin(x * 0.07 - y * 0.05) * 0.18;
      const falloff = Math.min(1, Math.hypot(x, y) / 28);
      position.setZ(i, (ripple + dune) * (0.5 + falloff * 0.5));
    }
    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);

    const sandTextures = createSeafloorTextureSet();
    this.seafloor = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: sandTextures.color,
        roughnessMap: sandTextures.roughness,
        bumpMap: sandTextures.bump,
        bumpScale: 0.08,
        color: 0x4f6470,
        roughness: 0.96,
        metalness: 0,
      })
    );
    this.seafloor.position.y = -0.92;
    this.seafloor.receiveShadow = true;
    this.group.add(this.seafloor);

    // Animated caustic overlay — additive plane just above the seafloor
    const causticTex = createCausticsTexture();
    causticTex.wrapS = causticTex.wrapT = THREE.RepeatWrapping;
    causticTex.repeat.set(2.6, 2.6);
    this.causticsMaterial = new THREE.MeshBasicMaterial({
      map: causticTex,
      color: 0x9fd0e6,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const causticPlane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), this.causticsMaterial);
    causticPlane.rotation.x = -Math.PI / 2;
    causticPlane.position.y = -0.86;
    this.group.add(causticPlane);
  }

  // ── Site of Grace (copied from LimgraveScene) ───────────────
  addSiteOfGrace() {
    const gracePosition = new THREE.Vector3(0, 0.98, -2.05);

    this.grace = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 32, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffd45a,
        transparent: true,
        opacity: 0.64,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    );
    this.grace.position.copy(gracePosition);
    this.grace.renderOrder = 34;
    this.group.add(this.grace);

    this.graceLight = new THREE.PointLight(0xffc84d, 9.2, 18);
    this.graceLight.position.set(gracePosition.x, gracePosition.y + 0.06, gracePosition.z);
    this.graceLight.castShadow = true;
    this.group.add(this.graceLight);

    this.gracePool = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 64),
      new THREE.MeshBasicMaterial({
        map: createLightPoolTexture(),
        color: 0xffc84d,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    );
    this.gracePool.rotation.x = -Math.PI / 2;
    this.gracePool.position.set(gracePosition.x, -0.84, gracePosition.z);
    this.gracePool.scale.setScalar(1.78);
    this.gracePool.renderOrder = 18;
    this.group.add(this.gracePool);

    this.graceFlame = new THREE.Group();
    this.graceFlame.position.set(gracePosition.x, gracePosition.y - 0.2, gracePosition.z);
    this.graceFlame.scale.setScalar(1.18);
    const flameTexture = createGraceFlameTexture();
    const wisps = [
      { x: 0, y: -0.44, z: 0, sx: 0.42, sy: 1.55, opacity: 0.58, phase: 2.6, speed: 0.95 },
      { x: 0, y: -0.04, z: 0, sx: 0.58, sy: 1.12, opacity: 0.56, phase: 5.2, speed: 1.05 },
      { x: 0, y: 0.2, z: 0, sx: 0.44, sy: 1.74, opacity: 0.95, phase: 0, speed: 1.2 },
      { x: -0.04, y: 0.16, z: 0.03, sx: 0.31, sy: 1.44, opacity: 0.64, phase: 1.7, speed: 1.6 },
      { x: 0.05, y: 0.13, z: -0.02, sx: 0.25, sy: 1.22, opacity: 0.5, phase: 3.1, speed: 1.45 },
      { x: 0.02, y: 0.38, z: 0.01, sx: 0.18, sy: 0.78, opacity: 0.5, phase: 4.4, speed: 1.9 },
    ];

    for (const wisp of wisps) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: flameTexture,
          color: 0xffd76a,
          transparent: true,
          opacity: wisp.opacity,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
        })
      );
      sprite.position.set(wisp.x, wisp.y, wisp.z);
      sprite.scale.set(wisp.sx, wisp.sy, 1);
      sprite.renderOrder = 36;
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
    this.graceFlame.renderOrder = 36;
    this.group.add(this.graceFlame);
  }

  // ── Background rocks (set dressing, non-interactive) ────────
  // CRITICAL: nothing on the camera→Grace sightline (x≈0, z<-1).
  // The Grace sits at (0, ~0.5, -2.4); leave a clear corridor behind it.
  addAmbientRocks() {
    const material = createRockMaterial();
    material.color.setHex(0x4a5a5e);
    const random = seededRandom(9187);
    const placements = [];

    for (let attempts = 0; placements.length < 16 && attempts < 140; attempts++) {
      const z = THREE.MathUtils.lerp(-7.4, -1.35, random());
      const distanceFade = THREE.MathUtils.clamp((z + 7.4) / 6.05, 0, 1);
      const maxX = THREE.MathUtils.lerp(7.9, 6.1, distanceFade);
      const x = (random() * 2 - 1) * maxX;

      // Keep the Grace and timeline readable. These rocks are water set dressing,
      // so they stay behind the timeline arc instead of touching the carved stones.
      const blocksGrace = z > -4.8 && Math.abs(x) < 2.75;
      const blocksTimeline = z > -2.35 && Math.abs(x) < 5.55;
      if (blocksGrace || blocksTimeline) continue;

      const y = THREE.MathUtils.lerp(-0.9, -0.72, random());
      const scale = THREE.MathUtils.lerp(0.2, 0.8, random()) * THREE.MathUtils.lerp(0.82, 1.08, distanceFade);
      placements.push([x, y, z, scale]);
    }

    placements.forEach(([x, y, z, scale], index) => {
      const rock = new THREE.Mesh(createWeatheredRockGeometry(311 + index * 23), material);
      const squash = 0.42 + random() * 0.3;
      const width = 0.95 + random() * 0.65;
      const depth = 0.72 + random() * 0.56;
      rock.position.set(x, y, z);
      rock.rotation.set(
        index * 0.41 + (random() - 0.5) * 0.7,
        index * 1.83 + (random() - 0.5) * 1.4,
        -0.12 + index * 0.09 + (random() - 0.5) * 0.4
      );
      rock.scale.set(scale * width, scale * squash, scale * depth);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    });
  }

  // ── Timeline stones — clickable carved monuments ────────────
  // Stones lay out in a gentle left-to-right arc in front of the Grace,
  // each tilted forward so the etched top reads cleanly to the camera.
  addTimelineStones() {
    const baseRockMaterial = createRockMaterial();
    baseRockMaterial.color.setHex(0x576668);

    const xSpread   = 4.4;     // half-width of the stone row
    const zCloser   = 1.4;     // outer stones (sides) sit closer to camera
    const zCenter   = 0.2;     // middle stones sit deeper, near Grace
    const forwardTilt = 0.18;  // ~10° forward — tops face camera

    experienceTimeline.forEach((entry, index) => {
      const t = experienceTimeline.length === 1
        ? 0.5
        : index / (experienceTimeline.length - 1);
      const offset  = (t - 0.5) * 2;          // -1..+1
      const x = offset * xSpread;
      // Cosine-shaped depth curve: middle is furthest back, ends are closer
      const depthCurve = Math.cos(offset * Math.PI * 0.5);
      const z = THREE.MathUtils.lerp(zCloser, zCenter, depthCurve);
      // Slight rotation so each stone faces the camera (origin-pointed)
      const yaw = -Math.atan2(x, 4.8 - z) * 0.6;

      const stone = new TimelineStone(entry, baseRockMaterial, 200 + index * 19);
      stone.position.set(x, -0.6, z);
      stone.rotation.set(forwardTilt, yaw, 0);
      stone.userData.entry = entry;
      stone.userData.clickable = true;
      this.stones.push(stone);
      this.group.add(stone);
    });
  }

  // ── God rays — soft additive cones from above ───────────────
  addGodRays() {
    const rayMaterial = new THREE.MeshBasicMaterial({
      map: createGodRayTexture(),
      color: 0x9ed4eb,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 5; i++) {
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 12), rayMaterial.clone());
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 1.8 + Math.random() * 2.4;
      ray.position.set(Math.cos(angle) * radius, 4.5, Math.sin(angle) * radius - 1.5);
      ray.rotation.set(0.18, angle + Math.PI, (Math.random() - 0.5) * 0.18);
      ray.userData = { phase: Math.random() * Math.PI * 2, baseOpacity: 0.14 + Math.random() * 0.1 };
      ray.material.opacity = ray.userData.baseOpacity;
      this.godRays.push(ray);
      this.godRayGroup.add(ray);
    }
  }

  // ── Bubbles drifting upward ─────────────────────────────────
  addBubbles() {
    const count = 32;
    const positions = new Float32Array(count * 3);
    this.bubbleData = [];
    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.random() * 4.5;
      const angle = Math.random() * Math.PI * 2;
      const y = -0.7 + Math.random() * 4.0;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 1.0;
      this.bubbleData.push({
        baseX: Math.cos(angle) * radius,
        baseZ: Math.sin(angle) * radius - 1.0,
        speed: 0.12 + Math.random() * 0.18,
        wobble: Math.random() * Math.PI * 2,
        wobbleAmp: 0.04 + Math.random() * 0.06,
      });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.bubbles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xc9e6f2,
        size: 0.06,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.group.add(this.bubbles);
  }

  // ── Suspended motes / plankton ──────────────────────────────
  addParticles() {
    const count = 110;
    const positions = new Float32Array(count * 3);
    this.moteData = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = -0.4 + Math.random() * 4.5;
      const z = -3 + (Math.random() - 0.5) * 9;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      this.moteData.push({
        baseX: x, baseY: y, baseZ: z,
        speedX: (Math.random() - 0.5) * 0.06,
        speedY: 0.02 + Math.random() * 0.04,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0x86b8c8,
        size: 0.022,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.group.add(this.motes);

    const graceCount = 46;
    const gracePositions = new Float32Array(graceCount * 3);
    this.graceMoteData = [];
    for (let i = 0; i < graceCount; i++) {
      const radius = 0.16 + Math.random() * 0.9;
      const angle = Math.random() * Math.PI * 2;
      const y = -0.58 + Math.random() * 2.35;
      const x = Math.cos(angle) * radius * 0.62;
      const z = -2.05 + Math.sin(angle) * radius * 0.28;
      gracePositions[i * 3] = x;
      gracePositions[i * 3 + 1] = 0.98 + y;
      gracePositions[i * 3 + 2] = z;
      this.graceMoteData.push({
        angle,
        radius,
        y,
        speed: 0.22 + Math.random() * 0.34,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    const graceGeometry = new THREE.BufferGeometry();
    graceGeometry.setAttribute('position', new THREE.BufferAttribute(gracePositions, 3));
    this.graceMotes = new THREE.Points(
      graceGeometry,
      new THREE.PointsMaterial({
        color: 0xffd060,
        size: 0.04,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    );
    this.graceMotes.renderOrder = 38;
    this.group.add(this.graceMotes);
  }

  getCameraConfig() {
    return {
      position: [0, 2.85, 8.0],
      target: [0, 0.05, 0.6],
      orbitRadius: 0,
      orbitSpeed: 0,
      mouseInfluence: 0.26,   // gentle swing — keep timeline stable
      bobAmount: 0.022,       // gentle underwater sway
      bobSpeed: 0.32,
    };
  }

  update(t, dt) {
    super.update(t, dt);

    // Caustics scroll
    if (this.causticsMaterial?.map) {
      this.causticsMaterial.map.offset.x = (t * 0.012) % 1;
      this.causticsMaterial.map.offset.y = (t * 0.008) % 1;
      this.causticsMaterial.opacity = 0.36 + Math.sin(t * 0.7) * 0.06;
    }

    // Grace
    const graceBaseY = 0.98;
    const graceZ = -2.05;
    const pulse = 1 + Math.sin(t * 2.4) * 0.12;
    this.grace.scale.setScalar(pulse);
    this.grace.position.set(0, graceBaseY + Math.sin(t * 1.7) * 0.025, graceZ);
    this.graceLight.position.set(0, this.grace.position.y + 0.06, graceZ);
    this.graceFlame.position.set(0, this.grace.position.y - 0.2, graceZ);
    this.gracePool.position.set(0, -0.84, graceZ);
    this.gracePool.scale.setScalar(1.78 + Math.sin(t * 1.25) * 0.08);
    this.gracePool.material.opacity = 0.52 + Math.sin(t * 1.5) * 0.06;
    this.graceLight.intensity = 10.2 + Math.sin(t * 2.2) * 1.2;

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

    // Stones — gentle bob + hover/focus glow modulation
    for (const stone of this.stones) {
      stone.update(t, this.hoveredStone === stone, this.focusedStone === stone);
    }

    // Hint fades while a stone is focused, breathes otherwise
    if (this.hint) {
      const targetOpacity = this.focusedStone ? 0 : (0.7 + Math.sin(t * 1.6) * 0.12);
      this.hint.material.opacity = THREE.MathUtils.lerp(
        this.hint.material.opacity,
        targetOpacity,
        0.06
      );
    }

    // God rays — sway + pulse
    for (const ray of this.godRays) {
      ray.material.opacity = ray.userData.baseOpacity * (0.7 + Math.sin(t * 0.4 + ray.userData.phase) * 0.3);
      ray.rotation.z = Math.sin(t * 0.18 + ray.userData.phase) * 0.06;
    }

    // Bubbles
    if (this.bubbles) {
      const positions = this.bubbles.geometry.attributes.position;
      for (let i = 0; i < this.bubbleData.length; i++) {
        const b = this.bubbleData[i];
        let y = positions.getY(i) + b.speed * dt;
        if (y > 4.2) y = -0.85;
        const wobbleX = Math.sin(t * 1.4 + b.wobble) * b.wobbleAmp;
        const wobbleZ = Math.cos(t * 1.1 + b.wobble) * b.wobbleAmp;
        positions.setXYZ(i, b.baseX + wobbleX, y, b.baseZ + wobbleZ);
      }
      positions.needsUpdate = true;
    }

    // Motes
    if (this.motes) {
      const positions = this.motes.geometry.attributes.position;
      for (let i = 0; i < this.moteData.length; i++) {
        const m = this.moteData[i];
        let x = positions.getX(i) + m.speedX * dt;
        let y = positions.getY(i) + m.speedY * dt;
        if (y > 4.2) y = -0.45;
        if (x > 7.5) x = -7.5;
        if (x < -7.5) x = 7.5;
        const wobble = Math.sin(t * 0.7 + m.wobble) * 0.018;
        positions.setXYZ(i, x + wobble, y, m.baseZ);
      }
      positions.needsUpdate = true;
    }

    if (this.graceMotes) {
      const positions = this.graceMotes.geometry.attributes.position;
      for (let i = 0; i < this.graceMoteData.length; i++) {
        const mote = this.graceMoteData[i];
        mote.y += dt * mote.speed;
        if (mote.y > 1.78) mote.y = -0.58;

        const angle = mote.angle + t * 0.26;
        const wobble = Math.sin(t * 1.45 + mote.wobble) * 0.07;
        positions.setXYZ(
          i,
          Math.cos(angle) * (mote.radius + wobble) * 0.62,
          0.98 + mote.y,
          graceZ + Math.sin(angle) * (mote.radius + wobble) * 0.28
        );
      }
      positions.needsUpdate = true;
      this.graceMotes.material.opacity = 0.74 + Math.sin(t * 1.8) * 0.1;
    }

    this.#updateFocusFade(dt);

    if (this.focusProgress > 0.001 && this.cameraRig) {
      const camera = this.cameraRig.camera;
      const eased = smootherStep(this.focusProgress);
      const lookEase = smootherStep(Math.max(0, this.focusProgress - 0.08) / 0.92);
      const rigPosition = camera.position.clone();
      camera.position.lerpVectors(rigPosition, this.focusCameraPosition, eased);
      this.currentLookTarget.lerpVectors(this.baseLookTarget, this.focusLookTarget, lookEase);
      camera.lookAt(this.currentLookTarget);
    } else {
      this.currentLookTarget.copy(this.baseLookTarget);
    }
  }

  getInteractiveObjects() {
    return this.stones.map((s) => s.hitbox).filter(Boolean);
  }

  handleSceneClick(hit) {
    const stone = this.#stoneFromHit(hit);
    if (stone) {
      this.#openStoneReader(stone);
    } else {
      this.#closeStoneReader();
    }
  }

  handleSceneMiss() {
    this.#closeStoneReader();
  }

  handleSceneHover(hit) {
    this.hoveredStone = this.#stoneFromHit(hit) ?? null;
  }

  exit() {
    this.#closeStoneReader();
    this.focusProgress = 0;
    super.exit();
  }

  dispose() {
    this.stoneOverlay?.remove();
    super.dispose();
  }

  #stoneFromHit(hit) {
    if (!hit) return null;
    let object = hit.object;
    while (object) {
      if (object.userData?.stone) return object.userData.stone;
      if (this.stones.includes(object)) return object;
      object = object.parent;
    }
    return null;
  }

  #openStoneReader(stone) {
    this.focusedStone = stone;
    this.hasOpenedOverlay = false;

    // Compute focus camera pose: ~1.6m away from stone, 0.6m above, looking at it
    const stonePos = new THREE.Vector3();
    stone.getWorldPosition(stonePos);
    const toCamera = new THREE.Vector3().subVectors(this.baseCameraPosition, stonePos).setY(0).normalize();
    this.focusCameraPosition.copy(stonePos).addScaledVector(toCamera, 1.7).setY(stonePos.y + 0.85);
    this.focusLookTarget.copy(stonePos).setY(stonePos.y + 0.05);
  }

  #closeStoneReader() {
    this.focusedStone = null;
    this.hasOpenedOverlay = false;
    if (this.stoneOverlay) {
      this.stoneOverlay.classList.remove('is-visible');
      this.stoneOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  #updateFocusFade(dt) {
    const target = this.focusedStone ? 1 : 0;
    const speed = this.focusedStone ? 1.2 : 1.6;
    this.focusProgress = THREE.MathUtils.clamp(
      this.focusProgress + Math.sign(target - this.focusProgress) * dt * speed,
      0,
      1
    );

    if (this.focusedStone && !this.hasOpenedOverlay && this.focusProgress > 0.85) {
      this.hasOpenedOverlay = true;
      populateStoneReader(this.stoneOverlay, this.focusedStone.userData.entry);
      this.stoneOverlay.classList.add('is-visible');
      this.stoneOverlay.setAttribute('aria-hidden', 'false');
    }
  }
}

// ── TimelineStone ─────────────────────────────────────────────
class TimelineStone extends THREE.Group {
  constructor(entry, sharedRockMaterial, seed) {
    super();
    this.entry = entry;

    // Flat boulder base — wider/taller to host the larger inscription
    const rock = new THREE.Mesh(createWeatheredRockGeometry(seed), sharedRockMaterial);
    rock.scale.set(1.25, 0.36, 0.92);
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.add(rock);
    this.rock = rock;

    // Etched-text plane resting on the top face
    const textTexture = createEtchedStoneTexture(entry);
    const textMaterial = new THREE.MeshStandardMaterial({
      map: textTexture,
      emissive: 0xf0d060,
      emissiveMap: textTexture,
      emissiveIntensity: 0.85,
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      depthWrite: false,
    });
    const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.86), textMaterial);
    textPlane.rotation.x = -Math.PI / 2;
    textPlane.position.y = 0.37;
    textPlane.receiveShadow = false;
    this.add(textPlane);
    this.textPlane = textPlane;
    this.textMaterial = textMaterial;
    this.baseEmissive = 0.85;

    const glowMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      color: 0xffd060,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 0.98), glowMaterial);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.392;
    glowPlane.renderOrder = 42;
    this.add(glowPlane);
    this.glowPlane = glowPlane;
    this.glowMaterial = glowMaterial;
    this.baseY = null;

    // Generous invisible hitbox so clicking near the stone counts
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.4, 1.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitbox.position.y = 0.1;
    hitbox.userData.stone = this;
    this.add(hitbox);
    this.hitbox = hitbox;

    this.userData.stone = this;
  }

  update(t, isHovered, isFocused) {
    if (this.baseY === null) this.baseY = this.position.y;
    const hoverAmount = isFocused ? 1 : isHovered ? 1 : 0;
    const targetY = this.baseY + hoverAmount * 0.12 + Math.sin(t * 2.6 + this.position.x) * hoverAmount * 0.018;
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, 0.14);

    // Hover/focus brightens the etched text
    const target = isFocused ? 2.75 : isHovered ? 2.45 : this.baseEmissive;
    this.textMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      this.textMaterial.emissiveIntensity,
      target,
      0.12
    );
    this.glowMaterial.opacity = THREE.MathUtils.lerp(
      this.glowMaterial.opacity,
      isFocused ? 0.82 : isHovered ? 0.68 : 0,
      0.16
    );
    const glowScale = isFocused ? 1.13 : isHovered ? 1.1 : 1;
    this.glowPlane.scale.setScalar(THREE.MathUtils.lerp(this.glowPlane.scale.x, glowScale, 0.14));
    // Subtle breathing on the etched glyphs
    this.textMaterial.emissiveIntensity += Math.sin(t * 1.4 + this.position.x * 0.7) * (isHovered || isFocused ? 0.11 : 0.05);
  }
}

// ── Stone-reader overlay (DOM) ──────────────────────────────
function createStoneReaderOverlay(onClose) {
  const app = document.getElementById('app');
  const overlay = document.createElement('section');
  overlay.className = 'tablet-reader stone-reader';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const panel = document.createElement('article');
  panel.className = 'tablet-reader__panel';

  const closeButton = document.createElement('button');
  closeButton.className = 'tablet-reader__close';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', onClose);

  const eyebrow = document.createElement('p');
  eyebrow.className = 'tablet-reader__eyebrow';

  const title = document.createElement('h2');
  title.className = 'tablet-reader__title';

  const body = document.createElement('div');
  body.className = 'tablet-reader__body';

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) onClose();
  });

  panel.append(closeButton, eyebrow, title, body);
  overlay.append(panel);
  app?.append(overlay);
  return overlay;
}

function populateStoneReader(overlay, entry) {
  if (!overlay) return;
  overlay.querySelector('.tablet-reader__eyebrow').textContent = entry.year;
  overlay.querySelector('.tablet-reader__title').textContent = entry.title;
  const body = overlay.querySelector('.tablet-reader__body');
  body.innerHTML = '';
  for (const paragraph of entry.body.split('\n\n')) {
    const text = paragraph.trim();
    if (!text) continue;
    const p = document.createElement('p');
    p.textContent = text;
    body.append(p);
  }
  body.scrollTop = 0;
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

function createGroundTextureSet() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  roughnessCanvas.width = roughnessCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;

  const colorCtx = colorCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const bumpImage = bumpCtx.createImageData(size, size);
  const random = seededRandom(48291);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;
      const broad = Math.sin(nx * 33 + ny * 17) * 0.5 + Math.cos(ny * 41 - nx * 9) * 0.5;
      const moss = Math.sin(nx * 92 + Math.sin(ny * 12) * 2.1) * 0.5 + 0.5;
      const grit = random();
      const soil = random() > 0.78 ? 0.42 : 0;
      const shade = 0.72 + broad * 0.13 + grit * 0.18 - soil * 0.22;
      const green = moss * 0.24 + broad * 0.07;
      colorImage.data[i] = Math.max(18, Math.min(122, 46 * shade + soil * 36));
      colorImage.data[i + 1] = Math.max(28, Math.min(138, 68 * shade + green * 72));
      colorImage.data[i + 2] = Math.max(15, Math.min(86, 34 * shade + green * 28));
      colorImage.data[i + 3] = 255;

      const roughness = 205 + random() * 46 - soil * 28;
      roughnessImage.data[i] = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;

      const bump = 118 + broad * 32 + random() * 58 + soil * 24;
      bumpImage.data[i] = bump;
      bumpImage.data[i + 1] = bump;
      bumpImage.data[i + 2] = bump;
      bumpImage.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughnessCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(9, 9);
    texture.anisotropy = 8;
  });

  return { color, roughness, bump };
}

function createRockMaterial() {
  const textureSet = createRockTextureSet();
  return new THREE.MeshStandardMaterial({
    color: 0xb9b4a3,
    map: textureSet.color,
    roughnessMap: textureSet.roughness,
    bumpMap: textureSet.bump,
    bumpScale: 0.115,
    roughness: 0.98,
    metalness: 0.015,
  });
}

function createRockTextureSet() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  roughnessCanvas.width = roughnessCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const bumpImage = bumpCtx.createImageData(size, size);
  const random = seededRandom(91731);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const vein = Math.abs(Math.sin((x + y * 1.7) * 0.035) + Math.cos((x * 1.8 - y) * 0.021));
      const fleck = random() > 0.965 ? 42 : 0;
      const lichen = random() > 0.955 ? 34 : 0;
      const value = 84 + vein * 21 + random() * 30 + fleck;
      colorImage.data[i] = value + lichen * 0.25;
      colorImage.data[i + 1] = value - 2 + lichen;
      colorImage.data[i + 2] = value - 10 + lichen * 0.22;
      colorImage.data[i + 3] = 255;

      const roughness = 214 + random() * 38;
      roughnessImage.data[i] = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;

      const bump = 106 + vein * 44 + random() * 64 + fleck * 0.5;
      bumpImage.data[i] = bump;
      bumpImage.data[i + 1] = bump;
      bumpImage.data[i + 2] = bump;
      bumpImage.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughnessCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.6, 1.6);
    texture.anisotropy = 8;
  });

  return { color, roughness, bump };
}

function createWeatheredRockGeometry(seed) {
  const random = seededRandom(seed * 991);
  const geometry = new THREE.IcosahedronGeometry(1, 4);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const normal = vertex.clone().normalize();
    const crease =
      Math.sin(normal.x * 12.4 + seed) * 0.08 +
      Math.cos(normal.y * 15.1 - seed * 0.4) * 0.07 +
      Math.sin((normal.z + normal.x) * 18.8) * 0.045 +
      (random() - 0.5) * 0.08;
    const flattened = normal.y < -0.38 ? 0.82 : 1;
    vertex.multiplyScalar((0.92 + crease) * flattened);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function createBarkMaterial() {
  const textureSet = createBarkTextureSet();
  return new THREE.MeshStandardMaterial({
    color: 0x8c7a63,
    map: textureSet.color,
    roughnessMap: textureSet.roughness,
    bumpMap: textureSet.bump,
    bumpScale: 0.13,
    roughness: 0.98,
    metalness: 0,
  });
}

function createBarkTextureSet() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  roughnessCanvas.width = roughnessCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const bumpImage = bumpCtx.createImageData(size, size);
  const random = seededRandom(61091);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const vertical = Math.sin(x * 0.105 + Math.sin(y * 0.035) * 2.4) * 0.5 + 0.5;
      const cracks = Math.pow(Math.abs(Math.sin(x * 0.038 + y * 0.014)), 7);
      const rings = Math.sin(y * 0.09 + vertical * 3.4) * 0.5 + 0.5;
      const speck = random();
      const value = 64 + vertical * 34 + rings * 16 - cracks * 44 + speck * 18;
      colorImage.data[i] = Math.max(28, Math.min(138, value + 16));
      colorImage.data[i + 1] = Math.max(22, Math.min(118, value + 3));
      colorImage.data[i + 2] = Math.max(18, Math.min(96, value - 14));
      colorImage.data[i + 3] = 255;

      const roughness = 222 + speck * 29;
      roughnessImage.data[i] = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;

      const bump = 98 + vertical * 58 + rings * 24 - cracks * 50 + speck * 42;
      bumpImage.data[i] = bump;
      bumpImage.data[i + 1] = bump;
      bumpImage.data[i + 2] = bump;
      bumpImage.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughnessCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.2, 3.6);
    texture.anisotropy = 8;
  });

  return { color, roughness, bump };
}

function createForestTree({ height, scale, seed, barkMaterial }) {
  const random = seededRandom(seed);
  const tree = new THREE.Group();
  const treeHeight = height * scale;
  const trunkHeight = treeHeight * (0.62 + random() * 0.08);
  const trunkTopRadius = (0.075 + random() * 0.065) * scale;
  const trunkBaseRadius = (0.17 + random() * 0.12) * scale;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkTopRadius, trunkBaseRadius, trunkHeight, 28, 16),
    barkMaterial
  );
  trunk.position.y = trunkHeight / 2;
  trunk.rotation.x = (random() - 0.5) * 0.035;
  trunk.rotation.z = (random() - 0.5) * 0.05;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const branchMaterial = barkMaterial;
  const branchCount = 5 + Math.floor(random() * 7);
  const branchBias = random() * Math.PI * 2;
  for (let i = 0; i < branchCount; i++) {
    const y = trunkHeight * (0.38 + random() * 0.48);
    const angle = branchBias + random() * Math.PI * 2 + Math.sin(i * 2.1) * 0.38;
    const length = (0.38 + random() * 0.92) * scale * (1 - i / (branchCount * 2.6));
    const rise = (-0.04 + random() * 0.54) * scale;
    const startOffset = (0.04 + random() * 0.06) * scale;
    const start = new THREE.Vector3(Math.cos(angle) * startOffset, y, Math.sin(angle) * startOffset);
    const mid = new THREE.Vector3(
      Math.cos(angle + (random() - 0.5) * 0.28) * length * 0.46,
      y + rise * 0.44 + (random() - 0.5) * 0.12,
      Math.sin(angle + (random() - 0.5) * 0.28) * length * 0.46
    );
    const end = new THREE.Vector3(Math.cos(angle) * length, y + rise, Math.sin(angle) * length);
    const branch = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 8, (0.016 + random() * 0.03) * scale, 10),
      branchMaterial
    );
    branch.castShadow = true;
    branch.receiveShadow = true;
    tree.add(branch);
  }

  const crownTexture = createTreeCrownTexture(seed + 77);
  const crownTint = new THREE.Color(0xb7c69f).lerp(new THREE.Color(0xf1e6b8), random() * 0.28);
  const crownMaterial = new THREE.MeshStandardMaterial({
    map: crownTexture,
    color: crownTint,
    roughness: 1,
    metalness: 0,
    transparent: true,
    alphaTest: 0.1 + random() * 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const crownHeight = treeHeight * (0.72 + random() * 0.24);
  const crownWidth = treeHeight * (0.42 + random() * 0.34);
  const crownY = trunkHeight + crownHeight * (0.1 + random() * 0.08);
  const crownOffset = new THREE.Vector3((random() - 0.5) * 0.24 * scale, -random() * 0.08 * scale, (random() - 0.5) * 0.18 * scale);
  const crossAngle = random() * Math.PI;
  const topCapY = trunkHeight + crownHeight * 0.18;
  const planes = [
    { ry: crossAngle, w: crownWidth, h: crownHeight, x: 0 },
    { ry: crossAngle + Math.PI / 2, w: crownWidth * (0.72 + random() * 0.28), h: crownHeight * (0.78 + random() * 0.28), x: (random() - 0.5) * 0.16 },
    { ry: crossAngle + Math.PI / 4 + (random() - 0.5) * 0.22, w: crownWidth * (0.42 + random() * 0.28), h: crownHeight * (0.66 + random() * 0.28), x: (random() - 0.5) * 0.24 },
    { ry: crossAngle + Math.PI / 3, w: crownWidth * 0.62, h: crownHeight * 0.56, x: (random() - 0.5) * 0.08, y: topCapY },
    { ry: crossAngle - Math.PI / 5, w: crownWidth * 0.46, h: crownHeight * 0.42, x: (random() - 0.5) * 0.1, y: trunkHeight },
  ];

  for (const plane of planes) {
    const crown = new THREE.Mesh(new THREE.PlaneGeometry(plane.w, plane.h, 6, 16), crownMaterial);
    crown.position.set(crownOffset.x + plane.x, (plane.y ?? crownY) + crownOffset.y, crownOffset.z);
    crown.rotation.y = plane.ry;
    crown.rotation.z = (random() - 0.5) * 0.08;
    crown.castShadow = true;
    tree.add(crown);
  }

  return tree;
}

function createTreeCrownTexture(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(seed);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const trunkGradient = ctx.createLinearGradient(344, 760, 426, 1010);
  trunkGradient.addColorStop(0, 'rgba(72, 58, 42, 0)');
  trunkGradient.addColorStop(0.22, 'rgba(72, 58, 42, 0.44)');
  trunkGradient.addColorStop(1, 'rgba(32, 24, 18, 0.9)');
  ctx.fillStyle = trunkGradient;
  ctx.beginPath();
  ctx.moveTo(355, 1008);
  ctx.bezierCurveTo(374, 856, 374, 764, 390, 648);
  ctx.bezierCurveTo(414, 774, 414, 866, 434, 1008);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 115; i++) {
    const x = 384 + (random() - 0.5) * 390 * (0.45 + random());
    const y = 180 + random() * 560;
    const rx = 42 + random() * 90;
    const ry = 26 + random() * 76;
    const alpha = 0.28 + random() * 0.36;
    const shade = 40 + Math.floor(random() * 42);
    const warm = 8 + Math.floor(random() * 22);
    ctx.fillStyle = `rgba(${shade + warm}, ${shade + 36}, ${shade + 16}, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (random() - 0.5) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 38; i++) {
    ctx.fillStyle = `rgba(10, 14, 7, ${0.08 + random() * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(
      384 + (random() - 0.5) * 470,
      260 + random() * 520,
      70 + random() * 150,
      24 + random() * 72,
      (random() - 0.5) * 1.1,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 6;
  return texture;
}

function createTreeImpostorTexture(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(seed);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(24, 20, 15, 0.82)';
  ctx.beginPath();
  ctx.moveTo(362, 1024);
  ctx.bezierCurveTo(380, 780, 366, 570, 398, 350);
  ctx.bezierCurveTo(430, 590, 416, 790, 446, 1024);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 132; i++) {
    const y = 112 + random() * 620;
    const spread = 130 + (y / 740) * 160;
    const x = 384 + (random() - 0.5) * spread * 2;
    const rx = 34 + random() * 94;
    const ry = 20 + random() * 68;
    const alpha = 0.18 + random() * 0.32;
    const value = 26 + Math.floor(random() * 34);
    ctx.fillStyle = `rgba(${value}, ${value + 22}, ${value + 9}, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (random() - 0.5) * 0.92, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 6;
  return texture;
}

function createCanopyShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  gradient.addColorStop(0.54, 'rgba(0, 0, 0, 0.34)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGrassBladeGeometry(segments = 6) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const width = THREE.MathUtils.lerp(0.052, 0.006, t);
    const y = t * 0.74;
    const curve = Math.sin(t * Math.PI * 0.75) * 0.07;
    const curl = Math.sin(t * Math.PI) * 0.018;
    vertices.push(-width, y, curve - curl, width, y, curve + curl);
    uvs.push(0, t, 1, t);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
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

// ── Underwater scene textures ─────────────────────────────────

function createUnderwaterBackgroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Vertical gradient: bright surface → deep abyss
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0.00, '#0b3447');
  gradient.addColorStop(0.16, '#0a2b3c');
  gradient.addColorStop(0.36, '#071f2f');
  gradient.addColorStop(0.58, '#051724');
  gradient.addColorStop(0.78, '#03101a');
  gradient.addColorStop(1.00, '#020a10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint diffuse light shafts across the upper band
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(34px)';
  const random = seededRandom(8821);

  // Soft water veils around the horizon area keep the background from
  // reading as two flat bands divided by a hard line.
  for (let i = 0; i < 9; i++) {
    const y = canvas.height * (0.32 + random() * 0.18);
    const x = canvas.width * (0.18 + random() * 0.64);
    ctx.fillStyle = `rgba(95, 155, 175, ${0.025 + random() * 0.035})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      420 + random() * 520,
      26 + random() * 42,
      (random() - 0.5) * 0.12,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  for (let i = 0; i < 14; i++) {
    const x = random() * canvas.width;
    ctx.fillStyle = `rgba(140, 200, 220, ${0.05 + random() * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      canvas.height * (0.04 + random() * 0.18),
      80 + random() * 180,
      18 + random() * 40,
      (random() - 0.5) * 0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // Particulate suspension grain
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 1800; i++) {
    const a = 0.03 + random() * 0.06;
    ctx.fillStyle = `rgba(160, 200, 220, ${a})`;
    ctx.fillRect(random() * canvas.width, random() * canvas.height, 1, 1);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function createCausticsTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const random = seededRandom(7777);

  // Build interlocking sine waves to fake voronoi-like caustic ridges
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;
      const a = Math.sin(nx * 18 + Math.sin(ny * 11) * 2.4);
      const b = Math.sin(ny * 22 + Math.cos(nx * 14) * 2.0);
      const c = Math.sin((nx + ny) * 28 + Math.sin(nx * ny * 24) * 1.6);
      const d = Math.sin(nx * 34 - ny * 17) * 0.5;
      let v = (a + b + c + d) * 0.25;            // -1..+1
      v = Math.max(0, v);                        // sharp cutoffs
      v = Math.pow(v, 3.4);                      // crisp caustic peaks
      const value = Math.min(255, v * 255 + random() * 6);
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = value;                 // alpha modulation too
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createGodRayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0.0,  'rgba(180, 220, 240, 0.55)');
  gradient.addColorStop(0.35, 'rgba(140, 200, 230, 0.32)');
  gradient.addColorStop(0.75, 'rgba(80, 140, 180, 0.08)');
  gradient.addColorStop(1.0,  'rgba(20, 60, 90, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Horizontal taper — fade left/right edges
  ctx.globalCompositeOperation = 'destination-in';
  const horiz = ctx.createLinearGradient(0, 0, canvas.width, 0);
  horiz.addColorStop(0.00, 'rgba(0,0,0,0)');
  horiz.addColorStop(0.50, 'rgba(0,0,0,1)');
  horiz.addColorStop(1.00, 'rgba(0,0,0,0)');
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSeafloorTextureSet() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  roughnessCanvas.width = roughnessCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const bumpImage = bumpCtx.createImageData(size, size);
  const random = seededRandom(50211);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;
      const ripple = Math.sin(nx * 38 + Math.sin(ny * 9) * 2.2) * 0.5 + 0.5;
      const grit = random();
      const pebble = random() > 0.96 ? 0.5 : 0;
      const algae = random() > 0.985 ? 0.4 : 0;
      const shade = 0.55 + ripple * 0.15 + grit * 0.18 - pebble * 0.15;

      // Cool blue-grey sand with hints of green algae
      colorImage.data[i]     = Math.max(28, Math.min(110, 64 * shade + algae * 18));
      colorImage.data[i + 1] = Math.max(36, Math.min(130, 78 * shade + algae * 38));
      colorImage.data[i + 2] = Math.max(40, Math.min(120, 76 * shade + grit * 12));
      colorImage.data[i + 3] = 255;

      const roughness = 218 + random() * 32 - pebble * 30;
      roughnessImage.data[i] = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;

      const bump = 96 + ripple * 38 + grit * 46 + pebble * 70;
      bumpImage.data[i] = bump;
      bumpImage.data[i + 1] = bump;
      bumpImage.data[i + 2] = bump;
      bumpImage.data[i + 3] = 255;
    }
  }
  colorCtx.putImageData(colorImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughnessCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(7, 7);
    texture.anisotropy = 8;
  });
  return { color, roughness, bump };
}

function createEtchedStoneTexture(entry) {
  const w = 1024;
  const h = 480;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // Decorative carved frame — a top hairline + a bottom underline
  // Tells the viewer at a glance that this is an inscribed plaque.
  ctx.strokeStyle = 'rgba(255, 230, 160, 0.55)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(80, 72);
  ctx.lineTo(w - 80, 72);
  ctx.stroke();

  ctx.lineWidth = 2.2;
  ctx.strokeStyle = 'rgba(245, 215, 130, 0.4)';
  ctx.beginPath();
  ctx.moveTo(180, h - 80);
  ctx.lineTo(w - 180, h - 80);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  // Year — large and heavy, the timeline anchor
  ctx.fillStyle = 'rgba(255, 240, 175, 1)';
  ctx.font = '600 192px "Cormorant Garamond", "EB Garamond", Georgia, serif';
  ctx.fillText(entry.year, w / 2, h * 0.36);

  // Title — italic serif, calmer weight
  ctx.fillStyle = 'rgba(248, 230, 180, 0.96)';
  ctx.font = 'italic 300 68px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(entry.title, w / 2, h * 0.74);

  // Weathered grain — punch out fine specks so the carving looks aged
  const random = seededRandom(entry.year.charCodeAt(0) * 71 + entry.title.length);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.04 + random() * 0.14})`;
    ctx.fillRect(random() * w, random() * h, 1.2 + random() * 1.6, 1.2 + random() * 1.6);
  }
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// ── Colosseum scene textures ──────────────────────────────────

function createMarbleMaterial({
  tint = 0xeae3d2,
  flutedBump = false,
  brightness = 1,
  veinStrength = 1,
  speckStrength = 1,
} = {}) {
  const textures = createMarbleTextureSet({ flutedBump, brightness, veinStrength, speckStrength });
  return new THREE.MeshStandardMaterial({
    color: tint,
    map: textures.color,
    roughnessMap: textures.roughness,
    bumpMap: textures.bump,
    bumpScale: flutedBump ? 0.12 : 0.05,
    roughness: 0.82,
    metalness: 0.015,
  });
}

function createRuinedArchGeometry(width = 1.34, height = 2.35, depth = 0.24) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.lineTo(-width / 2, -height / 2);

  const holeWidth = width * 0.56;
  const baseY = -height / 2 + 0.16;
  const springY = -height * 0.04;
  const hole = new THREE.Path();
  hole.moveTo(-holeWidth / 2, baseY);
  hole.lineTo(-holeWidth / 2, springY);
  hole.absarc(0, springY, holeWidth / 2, Math.PI, 0, true);
  hole.lineTo(holeWidth / 2, baseY);
  hole.lineTo(-holeWidth / 2, baseY);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 1,
  });
  geometry.center();
  return geometry;
}

function createMarbleTextureSet({
  flutedBump = false,
  brightness = 1,
  veinStrength = 1,
  speckStrength = 1,
} = {}) {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  roughnessCanvas.width = roughnessCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const bumpImage = bumpCtx.createImageData(size, size);
  const random = seededRandom(33179);

  // Layered sine bands give the long marble vein look
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;
      const veinA = Math.abs(Math.sin(nx * 14 + Math.cos(ny * 6) * 1.8));
      const veinB = Math.abs(Math.sin(ny * 18 - Math.cos(nx * 4) * 1.4));
      const grain = random();
      const speck = random() > 0.992 ? 0.4 : 0;
      const broad = Math.sin(nx * 4 + ny * 3) * 0.5 + 0.5;

      const value =
        214 +                       // aged marble base
        broad * 14 -                // broad warm/cool variation
        Math.pow(veinA, 4) * 38 * veinStrength -   // dark veins
        Math.pow(veinB, 5) * 30 * veinStrength -
        speck * 80 * speckStrength +
        grain * 8;

      const rB = Math.max(168, Math.min(252, value * brightness));
      const gB = Math.max(164, Math.min(250, (value - 3) * brightness));
      const bB = Math.max(154, Math.min(246, (value - 12) * brightness));   // slight warm tint
      colorImage.data[i]     = rB;
      colorImage.data[i + 1] = gB;
      colorImage.data[i + 2] = bB;
      colorImage.data[i + 3] = 255;

      const roughness = 158 + grain * 28 + Math.pow(veinA, 3) * 22 * veinStrength;
      roughnessImage.data[i]     = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;

      // Bump: subtle by default. For column shafts, add vertical fluting.
      let bump = 132 + grain * 18 - Math.pow(veinA, 4) * 24 * veinStrength;
      if (flutedBump) {
        // Sinusoidal vertical channels — read as classical fluting
        const flute = Math.cos(nx * Math.PI * 2 * 9);  // 9 flutes around the wrap
        bump += flute * 56;
      }
      bumpImage.data[i]     = bump;
      bumpImage.data[i + 1] = bump;
      bumpImage.data[i + 2] = bump;
      bumpImage.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughnessCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    t.anisotropy = 8;
  });
  return { color, roughness, bump };
}

function createSandTerrainGeometry(size = 120, segments = 180) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  const positions = geometry.attributes.position;
  const noise = createValueNoise2D(92821);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const radius = Math.sqrt(x * x + y * y);
    const centerFade = THREE.MathUtils.smoothstep(radius, 6.5, 13.5);
    const distanceFade = 1 - THREE.MathUtils.smoothstep(radius, 42, 60);
    const broad = noise.fbm(x * 0.045 + 12.3, y * 0.045 - 4.8, 5);
    const mid = noise.fbm(x * 0.16 - 5.2, y * 0.16 + 7.6, 4);
    const ripple = Math.sin(x * 0.34 + noise.fbm(x * 0.025, y * 0.025, 3) * 4.2) * 0.012;
    const height = ((broad - 0.5) * 0.42 + (mid - 0.5) * 0.12 + ripple) * centerFade * distanceFade;
    positions.setZ(i, height);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function createValueNoise2D(seed = 1) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const fade = (t) => t * t * (3 - 2 * t);
  const hash = (ix, iy) => {
    let n = ix * 374761393 + iy * 668265263 + seed * 1442695041;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  };
  const noise = (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = fade(x - x0);
    const yf = fade(y - y0);
    const a = hash(x0, y0);
    const b = hash(x0 + 1, y0);
    const c = hash(x0, y0 + 1);
    const d = hash(x0 + 1, y0 + 1);
    return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
  };
  const fbm = (x, y, octaves = 5) => {
    let value = 0;
    let amp = 0.5;
    let freq = 1;
    let total = 0;
    for (let octave = 0; octave < octaves; octave++) {
      value += noise(x * freq, y * freq) * amp;
      total += amp;
      amp *= 0.5;
      freq *= 2.08;
    }
    return value / total;
  };
  return { noise, fbm };
}

function createSandstoneFloorTextureSet() {
  const size = 2048;
  const colorCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  roughnessCanvas.width = roughnessCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const bumpImage = bumpCtx.createImageData(size, size);
  const random = seededRandom(40117);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fade = (t) => t * t * (3 - 2 * t);
  const hash = (ix, iy) => {
    let n = ix * 374761393 + iy * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  };
  const noise = (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = fade(x - x0);
    const yf = fade(y - y0);
    const a = hash(x0, y0);
    const b = hash(x0 + 1, y0);
    const c = hash(x0, y0 + 1);
    const d = hash(x0 + 1, y0 + 1);
    return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
  };
  const fbm = (x, y) => {
    let value = 0;
    let amp = 0.5;
    let freq = 1;
    let total = 0;
    for (let octave = 0; octave < 5; octave++) {
      value += noise(x * freq, y * freq) * amp;
      total += amp;
      amp *= 0.5;
      freq *= 2.15;
    }
    return value / total;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;
      const broad = fbm(nx * 9.5 + 9.5, ny * 9.5 - 2.1);
      const fine = fbm(nx * 118.0, ny * 118.0);
      const extraFine = fbm(nx * 280.0 + 4.8, ny * 280.0 - 7.1);
      const grit = random();
      const paleGrain = random() > 0.972 ? 1 : 0;
      const darkGrain = random() > 0.982 ? 1 : 0;
      const tinyShadow = Math.max(0, fine - 0.62) * 0.18;
      const saltPepper = (extraFine - 0.5) * 0.16;
      const shade = 0.9 + (broad - 0.5) * 0.16 + (fine - 0.5) * 0.16 + saltPepper + grit * 0.07 - darkGrain * 0.22;

      colorImage.data[i] = Math.max(158, Math.min(244, 202 * shade + paleGrain * 34));
      colorImage.data[i + 1] = Math.max(136, Math.min(226, 184 * shade + paleGrain * 28));
      colorImage.data[i + 2] = Math.max(102, Math.min(190, 142 * shade + paleGrain * 16));
      colorImage.data[i + 3] = 255;

      const roughness = 218 + fine * 28 + extraFine * 24 + grit * 20 - paleGrain * 16;
      roughnessImage.data[i]     = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;

      const bump = 104 + broad * 28 + fine * 58 + extraFine * 72 + paleGrain * 60 - tinyShadow * 60 - darkGrain * 32;
      bumpImage.data[i]     = bump;
      bumpImage.data[i + 1] = bump;
      bumpImage.data[i + 2] = bump;
      bumpImage.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughnessCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((t) => {
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.repeat.set(1, 1);
    t.anisotropy = 8;
  });
  return { color, roughness, bump };
}

function createColosseumSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  // Bright daytime gradient: pale blue zenith → warm haze at horizon
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0.00, '#8fc5ef');
  sky.addColorStop(0.24, '#b9dbf0');
  sky.addColorStop(0.48, '#e6dfc7');
  sky.addColorStop(0.68, '#efd9a7');
  sky.addColorStop(0.86, '#d6b879');
  sky.addColorStop(1.00, '#b98e4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sun disc + halo
  const sunX = 1320;
  const sunY = 360;
  const sunHalo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 1040);
  sunHalo.addColorStop(0.00, 'rgba(255, 250, 220, 0.95)');
  sunHalo.addColorStop(0.10, 'rgba(255, 246, 204, 0.72)');
  sunHalo.addColorStop(0.36, 'rgba(255, 228, 168, 0.26)');
  sunHalo.addColorStop(1.00, 'rgba(255, 220, 160, 0)');
  ctx.fillStyle = sunHalo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const rays = ctx.createLinearGradient(sunX - 280, 0, sunX - 760, canvas.height);
  rays.addColorStop(0.00, 'rgba(255, 248, 215, 0.22)');
  rays.addColorStop(0.34, 'rgba(255, 238, 190, 0.08)');
  rays.addColorStop(1.00, 'rgba(255, 238, 190, 0)');
  ctx.fillStyle = rays;
  ctx.beginPath();
  ctx.moveTo(sunX - 210, 0);
  ctx.lineTo(sunX + 70, 0);
  ctx.lineTo(sunX - 520, canvas.height);
  ctx.lineTo(sunX - 1180, canvas.height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const haze = ctx.createLinearGradient(0, canvas.height * 0.48, 0, canvas.height * 0.82);
  haze.addColorStop(0, 'rgba(255,255,255,0)');
  haze.addColorStop(0.54, 'rgba(255,232,178,0.22)');
  haze.addColorStop(1, 'rgba(244,206,132,0.34)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, canvas.height * 0.42, canvas.width, canvas.height * 0.44);

  // Soft cumulus clouds
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(44px)';
  const random = seededRandom(2447);
  for (let band = 0; band < 4; band++) {
    const y = canvas.height * (0.12 + band * 0.1) + (random() - 0.5) * 80;
    for (let i = 0; i < 22; i++) {
      const x = random() * canvas.width;
      const rx = 170 + random() * 380;
      const ry = 36 + random() * 72;
      ctx.fillStyle = `rgba(255, 252, 244, ${0.07 + random() * 0.11})`;
      ctx.beginPath();
      ctx.ellipse(x, y + (random() - 0.5) * 70, rx, ry, (random() - 0.5) * 0.16, 0, Math.PI * 2);
      ctx.fill();
      if (x < rx) {
        ctx.beginPath();
        ctx.ellipse(x + canvas.width, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function createHorizonMistTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(255, 238, 190, 0)');
  gradient.addColorStop(0.36, 'rgba(255, 236, 184, 0.36)');
  gradient.addColorStop(0.58, 'rgba(246, 213, 154, 0.58)');
  gradient.addColorStop(0.82, 'rgba(238, 194, 118, 0.18)');
  gradient.addColorStop(1, 'rgba(238, 194, 118, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const random = seededRandom(8821);
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(18px)';
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(255,255,245,${0.06 + random() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(
      random() * canvas.width,
      canvas.height * (0.34 + random() * 0.35),
      90 + random() * 180,
      10 + random() * 26,
      (random() - 0.5) * 0.2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGroundHazeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const center = canvas.width / 2;

  const radial = ctx.createRadialGradient(center, center, 0, center, center, center);
  radial.addColorStop(0.00, 'rgba(255, 238, 190, 0)');
  radial.addColorStop(0.18, 'rgba(255, 238, 190, 0)');
  radial.addColorStop(0.34, 'rgba(255, 234, 181, 0.08)');
  radial.addColorStop(0.52, 'rgba(246, 218, 166, 0.22)');
  radial.addColorStop(0.72, 'rgba(238, 204, 139, 0.34)');
  radial.addColorStop(0.90, 'rgba(238, 204, 139, 0.2)');
  radial.addColorStop(1.00, 'rgba(238, 204, 139, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const random = seededRandom(5611);
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(22px)';
  for (let i = 0; i < 34; i++) {
    const angle = random() * Math.PI * 2;
    const radius = canvas.width * (0.28 + random() * 0.34);
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    ctx.fillStyle = `rgba(255, 246, 218, ${0.04 + random() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      120 + random() * 260,
      34 + random() * 90,
      angle + Math.PI / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createProjectPlaqueTexture(project) {
  const w = 768;
  const h = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const panel = ctx.createLinearGradient(0, 80, 0, h - 90);
  panel.addColorStop(0, 'rgba(45, 35, 20, 0.32)');
  panel.addColorStop(0.48, 'rgba(34, 25, 15, 0.52)');
  panel.addColorStop(1, 'rgba(48, 36, 20, 0.3)');
  ctx.fillStyle = panel;
  roundedRect(ctx, 42, 68, w - 84, h - 136, 18);
  ctx.fill();

  ctx.strokeStyle = 'rgba(26, 19, 11, 0.7)';
  ctx.lineWidth = 8;
  roundedRect(ctx, 42, 68, w - 84, h - 136, 18);
  ctx.stroke();

  // Decorative rule lines
  ctx.strokeStyle = 'rgba(255, 224, 126, 0.88)';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(60, 110);
  ctx.lineTo(w - 60, 110);
  ctx.stroke();

  ctx.lineWidth = 2.2;
  ctx.strokeStyle = 'rgba(245, 205, 112, 0.62)';
  ctx.beginPath();
  ctx.moveTo(180, h - 110);
  ctx.lineTo(w - 180, h - 110);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 5;

  // Eyebrow (small italic header — e.g. "Hackathon · 2024")
  ctx.fillStyle = 'rgba(250, 218, 132, 0.98)';
  ctx.font = 'italic 500 52px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(project.eyebrow ?? '', w / 2, 200);

  // Title — multi-line wrap if needed
  ctx.fillStyle = 'rgba(255, 232, 138, 1)';
  ctx.font = '700 98px "Cormorant Garamond", "EB Garamond", Georgia, serif';
  const titleLines = wrapText(ctx, project.title, w - 112, 98);
  const titleStartY = h * 0.42 - (titleLines.length - 1) * 50;
  titleLines.forEach((line, i) => {
    ctx.strokeStyle = 'rgba(18, 12, 6, 0.78)';
    ctx.lineWidth = 6;
    ctx.strokeText(line, w / 2, titleStartY + i * 108);
    ctx.fillText(line, w / 2, titleStartY + i * 108);
  });

  // Carved fleur / decorative dot
  ctx.fillStyle = 'rgba(245, 204, 102, 0.86)';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.74, 6, 0, Math.PI * 2);
  ctx.fill();

  // "Click to read" mini hint at the bottom
  ctx.fillStyle = 'rgba(236, 205, 140, 0.82)';
  ctx.font = 'italic 400 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Inscribed · click to read', w / 2, h * 0.86);

  // Weathered grain
  const random = seededRandom(project.title.length * 91 + (project.eyebrow?.length ?? 0));
  ctx.shadowColor = 'transparent';
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 360; i++) {
    ctx.fillStyle = `rgba(245, 225, 170, ${0.015 + random() * 0.045})`;
    ctx.fillRect(random() * w, random() * h, 1.2 + random() * 1.6, 1.2 + random() * 1.6);
    ctx.fillStyle = `rgba(0,0,0,${0.025 + random() * 0.08})`;
    ctx.fillRect(random() * w, random() * h, 1.2 + random() * 1.6, 1.2 + random() * 1.6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
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

// ── Skills scene helpers ────────────────────────────────────
function createSkillsNightSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(28941);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#02030a');
  gradient.addColorStop(0.32, '#05071a');
  gradient.addColorStop(0.6, '#09091a');
  gradient.addColorStop(0.82, '#0a0810');
  gradient.addColorStop(1, '#040406');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sparse stars
  for (let i = 0; i < 460; i++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height * 0.7;
    const r = random() * 1.4 + 0.2;
    const a = 0.18 + random() * 0.6;
    ctx.fillStyle = `rgba(${190 + Math.floor(random() * 50)}, ${200 + Math.floor(random() * 40)}, 255, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heavy dark cloud bands to keep the night feeling oppressive
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = 'blur(50px)';
  ctx.fillStyle = 'rgba(2, 3, 8, 0.55)';
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.ellipse(
      random() * canvas.width,
      canvas.height * (0.42 + random() * 0.4),
      220 + random() * 360,
      40 + random() * 90,
      (random() - 0.5) * 0.32,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // Deep horizon vignette
  const horizon = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
  horizon.addColorStop(0, 'rgba(0, 0, 0, 0)');
  horizon.addColorStop(0.55, 'rgba(0, 0, 0, 0.42)');
  horizon.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function createSkillsGroundTextureSet() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  roughnessCanvas.width = roughnessCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const bumpImage = bumpCtx.createImageData(size, size);
  const random = seededRandom(20451);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const broad = Math.sin(x * 0.034 + y * 0.026) * 0.5 + Math.cos(y * 0.052 - x * 0.018) * 0.5;
      const cracks = Math.pow(Math.abs(Math.sin(x * 0.08 + y * 0.03)), 9);
      const speck = random();
      const ash = random() > 0.86 ? 0.32 : 0;
      const grit = random() > 0.92 ? 18 : 0;
      const value = 36 + broad * 14 + speck * 18 - cracks * 28 - ash * 12;
      colorImage.data[i] = Math.max(10, Math.min(74, value + 4));
      colorImage.data[i + 1] = Math.max(8, Math.min(64, value + 1));
      colorImage.data[i + 2] = Math.max(8, Math.min(58, value - 6));
      colorImage.data[i + 3] = 255;

      const roughness = 222 + speck * 28 - ash * 18;
      roughnessImage.data[i] = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;

      const bump = 100 + broad * 36 + speck * 64 - cracks * 60 + grit;
      bumpImage.data[i] = bump;
      bumpImage.data[i + 1] = bump;
      bumpImage.data[i + 2] = bump;
      bumpImage.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughnessCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(7, 7);
    texture.anisotropy = 8;
  });
  return { color, roughness, bump };
}

function createSwordBladeTextureSet() {
  // Brushed steel: vertical grain along the blade's length, soft central highlight,
  // very subtle scattered specks. No repeating cross-pattern.
  const w = 64;
  const h = 1024;
  const colorCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  colorCanvas.width = roughCanvas.width = w;
  colorCanvas.height = roughCanvas.height = h;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(w, h);
  const roughImage = roughCtx.createImageData(w, h);
  const random = seededRandom(80213);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const fromCenter = Math.abs(x - w / 2) / (w / 2);
      // Soft polished gleam along the centerline
      const gleam = Math.pow(1 - fromCenter, 2.4) * 22;
      // Slow drift of the brushed-grain stripes along the blade's length
      const drift = Math.sin(y * 0.0028) * 1.6;
      // Long fine vertical streaks (constant along y, varying across x)
      const streak = (Math.sin((x + drift) * 0.95) * 0.5 + 0.5) * 4;
      const microStreak = (Math.sin((x + drift) * 3.7) * 0.5 + 0.5) * 2;
      // Sparse hot specks and occasional dark dust grain
      const speck = random() > 0.997 ? 26 : 0;
      const dust = random() > 0.985 ? 6 : random() * 1.6;
      const base = 184 - fromCenter * 22 + gleam + streak + microStreak - dust + speck;
      const v = Math.max(132, Math.min(232, base));
      colorImage.data[i] = v - 2;
      colorImage.data[i + 1] = v;
      colorImage.data[i + 2] = v + 4; // slight cool tint on cold steel
      colorImage.data[i + 3] = 255;

      // Roughness: smoother near the centerline, a touch rougher at the edges
      const r = 64 + fromCenter * 22 + streak * 1.2 + dust * 2 + random() * 4;
      roughImage.data[i] = r;
      roughImage.data[i + 1] = r;
      roughImage.data[i + 2] = r;
      roughImage.data[i + 3] = 255;
    }
  }
  colorCtx.putImageData(colorImage, 0, 0);
  roughCtx.putImageData(roughImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness].forEach((t) => {
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 16;
  });
  return { color, roughness };
}

function createSkillSword(skillName, seed) {
  const random = seededRandom(seed * 311 + 7);
  const group = new THREE.Group();

  const blade = createSwordBladeTextureSet();
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6becb,
    map: blade.color,
    roughnessMap: blade.roughness,
    emissive: 0x141a26,
    emissiveIntensity: 0.05,
    roughness: 0.22,
    metalness: 0.95,
    envMapIntensity: 0.85,
  });
  const guardMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c7c34,
    emissive: 0x3a2810,
    emissiveIntensity: 0.12,
    roughness: 0.42,
    metalness: 0.7,
  });
  const gripMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1610,
    roughness: 0.86,
    metalness: 0.06,
  });
  const wrapMaterial = new THREE.MeshStandardMaterial({
    color: 0x18100a,
    roughness: 0.92,
    metalness: 0.04,
  });
  const pommelMaterial = new THREE.MeshStandardMaterial({
    color: 0xa5832e,
    emissive: 0x3c2810,
    emissiveIntensity: 0.18,
    roughness: 0.4,
    metalness: 0.7,
  });

  // Tapered blade — shape with a sharp tip at y=0 and broader at the top
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(-0.045, 0.085);
  bladeShape.lineTo(-0.062, 0.45);
  bladeShape.lineTo(-0.066, 0.95);
  bladeShape.lineTo(-0.07, 1.18);
  bladeShape.lineTo(0.07, 1.18);
  bladeShape.lineTo(0.066, 0.95);
  bladeShape.lineTo(0.062, 0.45);
  bladeShape.lineTo(0.045, 0.085);
  bladeShape.lineTo(0, 0);

  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 6,
  });
  bladeGeometry.translate(0, 0, -0.012);

  const bladeMesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
  bladeMesh.castShadow = true;
  bladeMesh.receiveShadow = true;
  group.add(bladeMesh);

  // Subtle fuller — a thin darker inset on each face
  const fullerGeom = new THREE.PlaneGeometry(0.022, 0.84);
  const fullerMat = new THREE.MeshStandardMaterial({
    color: 0x6b7480,
    roughness: 0.55,
    metalness: 0.55,
  });
  const fullerFront = new THREE.Mesh(fullerGeom, fullerMat);
  fullerFront.position.set(0, 0.62, 0.0125);
  group.add(fullerFront);
  const fullerBack = fullerFront.clone();
  fullerBack.position.z = -0.0125;
  fullerBack.rotation.y = Math.PI;
  group.add(fullerBack);

  // Crossguard — slight S-curve via two boxes
  const guardCenter = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.045, 0.072),
    guardMaterial
  );
  guardCenter.position.y = 1.2;
  guardCenter.castShadow = true;
  group.add(guardCenter);

  const guardCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.07, 14),
    guardMaterial
  );
  guardCap.rotation.z = Math.PI / 2;
  guardCap.position.set(0, 1.2, 0);
  guardCap.scale.set(1, 0.7, 1);
  group.add(guardCap);

  // Habaki / collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.038, 0.05, 16),
    pommelMaterial
  );
  collar.position.y = 1.235;
  group.add(collar);

  // Grip
  const gripHeight = 0.2;
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.029, gripHeight, 18),
    gripMaterial
  );
  grip.position.y = 1.235 + gripHeight / 2 + 0.005;
  grip.castShadow = true;
  group.add(grip);

  // Leather wrap as a series of rings
  const ringCount = 5;
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.03, 0.005, 6, 14),
      wrapMaterial
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = grip.position.y - gripHeight / 2 + 0.022 + i * (gripHeight - 0.04) / (ringCount - 1);
    group.add(ring);
  }

  // Pommel
  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(0.044, 16, 12),
    pommelMaterial
  );
  pommel.position.y = grip.position.y + gripHeight / 2 + 0.028;
  pommel.scale.set(1, 0.85, 1);
  pommel.castShadow = true;
  group.add(pommel);

  // Plaque label hovering above the sword — large and bright so it reads from far away
  const plaqueTexture = createSwordPlaqueTexture(skillName);
  const plaque = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: plaqueTexture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
    })
  );
  plaque.renderOrder = 40;
  const plaqueY = pommel.position.y + 0.46;
  plaque.position.set(0, plaqueY, 0);
  plaque.scale.set(1.7, 0.5, 1);
  group.add(plaque);

  // Cool halo behind the plaque — silver moonlight against the warm scene
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialGlowTexture('rgba(196, 218, 248, 0.85)'),
      color: 0x9fb6d8,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
  );
  halo.renderOrder = 39;
  halo.position.set(0, plaqueY, -0.01);
  halo.scale.set(1.7, 0.85, 1);
  group.add(halo);

  // Small dust mound at the base — circular dark ring
  const mound = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 22),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
  );
  mound.rotation.x = -Math.PI / 2;
  mound.position.y = 0.005;
  group.add(mound);

  const phase = random() * Math.PI * 2;
  group.userData = {
    update: (t) => {
      const shimmer = Math.sin(t * 1.4 + phase) * 0.04 + 0.98;
      bladeMaterial.emissiveIntensity = 0.05 + 0.05 * Math.sin(t * 1.7 + phase);
      plaque.material.opacity = 0.94 + 0.06 * Math.sin(t * 1.6 + phase);
      halo.material.opacity = 0.32 + 0.1 * Math.sin(t * 1.6 + phase * 1.2);
      halo.scale.set(1.7 * shimmer, 0.85 * shimmer, 1);
    },
  };

  return group;
}

function createSwordPlaqueTexture(text) {
  // Cool moonlit silver text — contrasts against the warm flame light, with a
  // tighter glow so it reads clearly without bloom.
  const w = 1280;
  const h = 320;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 132px "Cormorant Garamond", "Times New Roman", Georgia, serif';

  // Outer cool halo
  ctx.shadowColor = 'rgba(168, 198, 240, 0.85)';
  ctx.shadowBlur = 32;
  ctx.fillStyle = 'rgba(212, 226, 248, 0.95)';
  ctx.fillText(text, w / 2, h / 2);

  // Tight cool gleam
  ctx.shadowColor = 'rgba(192, 214, 248, 0.95)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#e8eefb';
  ctx.fillText(text, w / 2, h / 2);

  // Crisp bright core
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fbfdff';
  ctx.fillText(text, w / 2, h / 2);

  // Subtle dark outline so the letters hold their shape against bright halos
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(20, 28, 48, 0.65)';
  ctx.strokeText(text, w / 2, h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

function createBattlefieldSteel({ tint = 0x6c6f76, rough = 0.55, metal = 0.82 } = {}) {
  return new THREE.MeshStandardMaterial({
    color: tint,
    roughness: rough,
    metalness: metal,
    emissive: 0x10131a,
    emissiveIntensity: 0.05,
  });
}

function createKnightHelm(seed) {
  const random = seededRandom(seed * 23 + 11);
  const group = new THREE.Group();

  const steel = createBattlefieldSteel({ tint: 0x5d6068 });
  const darkSteel = createBattlefieldSteel({ tint: 0x3d4047, rough: 0.7, metal: 0.7 });
  const trim = createBattlefieldSteel({ tint: 0x8a6a2e, rough: 0.4, metal: 0.7 });
  trim.emissive = new THREE.Color(0x261805);
  trim.emissiveIntensity = 0.18;

  // Domed crown
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    steel
  );
  dome.position.y = 0.16;
  dome.castShadow = true;
  dome.receiveShadow = true;
  group.add(dome);

  // Lower face guard — slightly tapered cylinder
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.185, 0.18, 28, 1, true),
    steel
  );
  face.position.y = 0.07;
  face.castShadow = true;
  face.receiveShadow = true;
  group.add(face);

  // Crown ridge (a thin raised rib running front-to-back)
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.04, 0.4),
    darkSteel
  );
  ridge.position.y = 0.34;
  group.add(ridge);

  // Brim ring at the join between dome and face
  const brim = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.018, 10, 32),
    trim
  );
  brim.rotation.x = Math.PI / 2;
  brim.position.y = 0.16;
  group.add(brim);

  // Eye slit — a thin recessed dark band wrapping around the front
  const slit = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.022, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.95, metalness: 0.1 })
  );
  slit.position.set(0, 0.115, 0.18);
  group.add(slit);

  // Reinforcing bar between the eyes
  const noseBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.07, 0.02),
    darkSteel
  );
  noseBar.position.set(0, 0.115, 0.2);
  group.add(noseBar);

  // Riveted dots along the brim (just small spheres)
  const rivetMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5, metalness: 0.85 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), rivetMat);
    rivet.position.set(Math.cos(a) * 0.198, 0.16, Math.sin(a) * 0.198);
    group.add(rivet);
  }

  // Neck guard — a small flared collar at the bottom
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.205, 0.16, 0.04, 28, 1, true),
    steel
  );
  collar.position.y = -0.005;
  group.add(collar);

  group.rotation.y = random() * Math.PI * 2;
  return group;
}

function createBattleShield(seed) {
  const random = seededRandom(seed * 17 + 5);
  const group = new THREE.Group();

  // Heater shield silhouette
  const shape = new THREE.Shape();
  shape.moveTo(-0.36, 0.42);
  shape.lineTo(0.36, 0.42);
  shape.bezierCurveTo(0.36, 0.05, 0.32, -0.34, 0, -0.54);
  shape.bezierCurveTo(-0.32, -0.34, -0.36, 0.05, -0.36, 0.42);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geom.center();

  const facingMat = new THREE.MeshStandardMaterial({
    color: 0x4b3522,
    roughness: 0.86,
    metalness: 0.06,
  });
  const shield = new THREE.Mesh(geom, facingMat);
  shield.castShadow = true;
  shield.receiveShadow = true;
  group.add(shield);

  // Iron rim around the perimeter — built from segments hugging the edge
  const rimMat = createBattlefieldSteel({ tint: 0x3a3c40, rough: 0.5, metal: 0.78 });
  const rimSegments = 18;
  for (let i = 0; i < rimSegments; i++) {
    const t = i / rimSegments;
    const angle = t * Math.PI * 2;
    // Approximate the heater outline with an ellipse — close enough at this scale
    const rx = 0.4;
    const ry = 0.5;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry - 0.06;
    const next = ((i + 1) / rimSegments) * Math.PI * 2;
    const nx = Math.cos(next) * rx;
    const ny = Math.sin(next) * ry - 0.06;
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, Math.hypot(nx - x, ny - y) * 1.04, 6),
      rimMat
    );
    seg.position.set((x + nx) / 2, (y + ny) / 2, 0.04);
    seg.rotation.z = Math.atan2(ny - y, nx - x) - Math.PI / 2;
    group.add(seg);
  }

  // Central iron boss
  const bossMat = createBattlefieldSteel({ tint: 0x35373c, rough: 0.42, metal: 0.85 });
  const boss = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2.2),
    bossMat
  );
  boss.position.z = 0.05;
  boss.position.y = -0.06;
  group.add(boss);

  // Cross detail in tarnished bronze — two thin bars
  const detailMat = new THREE.MeshStandardMaterial({
    color: 0x7d5e2a,
    emissive: 0x2a1a06,
    emissiveIntensity: 0.18,
    roughness: 0.55,
    metalness: 0.6,
  });
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.012), detailMat);
  vBar.position.set(0, -0.06, 0.045);
  group.add(vBar);
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.012), detailMat);
  hBar.position.set(0, 0.05, 0.045);
  group.add(hBar);

  // Cracks/wear via a couple dark scuffs
  const scuffMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.42,
  });
  for (let i = 0; i < 3; i++) {
    const scuff = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.04), scuffMat);
    scuff.position.set(
      (random() - 0.5) * 0.5,
      (random() - 0.5) * 0.7,
      0.05
    );
    scuff.rotation.z = (random() - 0.5) * 1.4;
    group.add(scuff);
  }

  return group;
}

function createFallenSword(seed) {
  const random = seededRandom(seed * 41 + 3);
  const group = new THREE.Group();

  const bladeMat = createBattlefieldSteel({ tint: 0x80868f, rough: 0.42, metal: 0.88 });
  const guardMat = new THREE.MeshStandardMaterial({
    color: 0x6c5320,
    emissive: 0x2a1c06,
    emissiveIntensity: 0.16,
    roughness: 0.45,
    metalness: 0.7,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x2a1810,
    roughness: 0.86,
    metalness: 0.05,
  });
  const pommelMat = guardMat.clone();

  // Blade — broken near the tip on some swords
  const broken = random() > 0.55;
  const bladeLen = broken ? 0.55 + random() * 0.2 : 0.78 + random() * 0.16;

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, -0.04);
  bladeShape.lineTo(0, 0.04);
  bladeShape.lineTo(bladeLen - 0.04, 0.045);
  if (broken) {
    // jagged break
    bladeShape.lineTo(bladeLen, 0.025);
    bladeShape.lineTo(bladeLen - 0.025, 0.005);
    bladeShape.lineTo(bladeLen + 0.01, -0.012);
    bladeShape.lineTo(bladeLen - 0.02, -0.03);
  } else {
    bladeShape.lineTo(bladeLen, 0);
  }
  bladeShape.lineTo(bladeLen - 0.04, -0.045);
  bladeShape.lineTo(0, -0.04);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 1,
  });
  bladeGeom.translate(0, 0, -0.009);
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  blade.castShadow = true;
  blade.receiveShadow = true;
  group.add(blade);

  // Crossguard
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.16, 0.036),
    guardMat
  );
  guard.position.set(-0.03, 0, 0);
  group.add(guard);

  // Grip
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.02, 0.13, 14),
    gripMat
  );
  grip.rotation.z = Math.PI / 2;
  grip.position.set(-0.115, 0, 0);
  group.add(grip);

  // Pommel
  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 14, 10),
    pommelMat
  );
  pommel.position.set(-0.19, 0, 0);
  group.add(pommel);

  // Lay the sword flat on the ground (rotate so its length runs along Z)
  group.rotation.x = -Math.PI / 2;
  group.rotation.y = 0;
  group.rotation.z = (random() - 0.5) * 0.6;

  return group;
}

function createFallenSpear(seed) {
  const random = seededRandom(seed * 59 + 7);
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4b2f1a,
    roughness: 0.92,
    metalness: 0.04,
  });
  const headMat = createBattlefieldSteel({ tint: 0x70757d, rough: 0.5, metal: 0.82 });
  const bandMat = createBattlefieldSteel({ tint: 0x49423a, rough: 0.6, metal: 0.65 });

  const shaftLen = 0.95 + random() * 0.25;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.018, shaftLen, 10),
    woodMat
  );
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // Spearhead at the top
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.03, 0.16, 12),
    headMat
  );
  head.position.y = shaftLen / 2 + 0.08;
  head.castShadow = true;
  group.add(head);

  // Connecting socket
  const socket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12),
    bandMat
  );
  socket.position.y = shaftLen / 2 + 0.012;
  group.add(socket);

  // Decorative rope/leather binding mid-shaft
  for (let i = 0; i < 3; i++) {
    const wrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.019, 0.004, 6, 14),
      new THREE.MeshStandardMaterial({ color: 0x2d1b0a, roughness: 0.95, metalness: 0.04 })
    );
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = shaftLen * 0.18 - i * 0.025;
    group.add(wrap);
  }

  // Lay flat
  group.rotation.x = Math.PI / 2;
  group.rotation.z = (random() - 0.5) * 0.4;

  return group;
}

function createFlameArrow(yaw, lean) {
  const group = new THREE.Group();

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b4a2a,
    emissive: 0x2a1808,
    emissiveIntensity: 0.18,
    roughness: 0.86,
    metalness: 0.04,
  });
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a4928,
    emissive: 0xff7a22,
    emissiveIntensity: 0.95,
    roughness: 0.36,
    metalness: 0.65,
  });
  const fletchMaterial = new THREE.MeshStandardMaterial({
    color: 0x6e3a1d,
    side: THREE.DoubleSide,
    roughness: 0.95,
    metalness: 0,
  });

  // Built tip-DOWN: arrowhead point at local origin (y=0) plunging into the ground,
  // shaft rising up, fletching/nock at top. The whole group is rotated to lean.
  const headLength = 0.13;
  const shaftHeight = 1.0;

  // Arrowhead — cone, tip down, base up. ConeGeometry's tip is at +y by default,
  // so rotate 180° around X to point downward and offset so the tip sits at y=0.
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.038, headLength, 12),
    headMaterial
  );
  head.rotation.x = Math.PI;
  head.position.y = headLength / 2;
  head.castShadow = true;
  group.add(head);

  // Heated rim where the head meets the shaft (just above the buried portion)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.006, 8, 16),
    headMaterial
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = headLength + 0.005;
  group.add(rim);

  // Shaft above the head
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.013, shaftHeight, 10),
    woodMaterial
  );
  shaft.position.y = headLength + shaftHeight / 2;
  shaft.castShadow = true;
  group.add(shaft);

  // Fletching at the top — back of the arrow now sits high in the air
  const fletchY = headLength + shaftHeight - 0.08;
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const fletch = new THREE.Mesh(
      new THREE.PlaneGeometry(0.075, 0.18),
      fletchMaterial
    );
    fletch.position.set(Math.cos(angle) * 0.02, fletchY, Math.sin(angle) * 0.02);
    fletch.rotation.y = angle;
    fletch.rotation.z = 0.18;
    group.add(fletch);
  }

  // Nock at the very top
  const nock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.024, 8),
    woodMaterial
  );
  nock.position.y = headLength + shaftHeight + 0.005;
  group.add(nock);

  // Flame burning at the buried tip — wraps the embedded arrowhead and licks up
  const flameTexture = createGraceFlameTexture();
  const flameGroup = new THREE.Group();
  // Flame anchored just above the rim so it appears to burn the arrowhead
  flameGroup.position.set(0, headLength + 0.02, 0);

  const wisps = [
    { sx: 0.32, sy: 0.62, color: 0xff7a1c, opacity: 1, phase: 0, speed: 1.4, offsetY: 0.18 },
    { sx: 0.24, sy: 0.46, color: 0xffaa3c, opacity: 0.92, phase: 1.2, speed: 1.7, offsetY: 0.12 },
    { sx: 0.18, sy: 0.34, color: 0xffd968, opacity: 0.82, phase: 2.4, speed: 1.95, offsetY: 0.07 },
    { sx: 0.12, sy: 0.22, color: 0xfff2bc, opacity: 0.7, phase: 3.6, speed: 2.3, offsetY: 0.02 },
  ];
  const flameSprites = [];
  for (const w of wisps) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flameTexture,
        color: w.color,
        transparent: true,
        opacity: w.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sprite.position.set(0, w.offsetY, 0);
    sprite.scale.set(w.sx, w.sy, 1);
    sprite.userData = { ...w };
    flameSprites.push(sprite);
    flameGroup.add(sprite);
  }
  group.add(flameGroup);

  // Outer warm halo
  const haloSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialGlowTexture('rgba(255, 152, 64, 0.95)'),
      color: 0xff8a36,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  haloSprite.position.set(0, headLength + 0.16, 0);
  haloSprite.scale.set(1.25, 1.25, 1);
  group.add(haloSprite);

  // Ground glow pool — a flat disc of warm light on the dirt right at the impact point
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 32),
    new THREE.MeshBasicMaterial({
      map: createLightPoolTexture(),
      color: 0xff8a36,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.005;
  group.add(pool);

  // Point light at the flame — brighter since this is now a primary scene light
  const flameLight = new THREE.PointLight(0xff8a36, 5.6, 5.8, 1.7);
  flameLight.position.set(0, headLength + 0.2, 0);
  flameLight.castShadow = false;
  group.add(flameLight);

  // Apply orientation: yaw around Y, lean tilts the shaft away from vertical.
  // The pivot is the local origin = the buried arrowhead tip, so the tip stays
  // planted while the rest of the arrow leans.
  group.rotation.order = 'YXZ';
  group.rotation.y = yaw;
  group.rotation.x = -lean;

  const flickerSeed = yaw * 11.3 + lean * 7.7;

  return {
    group,
    light: flameLight,
    sprites: flameSprites,
    update: (t) => {
      const flicker =
        Math.sin(t * 7.2 + flickerSeed) * 0.35 +
        Math.sin(t * 13.1 + flickerSeed * 0.6) * 0.18 +
        Math.sin(t * 23.4 + flickerSeed * 0.3) * 0.08;
      flameLight.intensity = 4.4 + flicker * 0.9;
      haloSprite.material.opacity = 0.46 + flicker * 0.18;
      const haloPulse = 1 + Math.sin(t * 3.4 + flickerSeed) * 0.08;
      haloSprite.scale.set(0.95 * haloPulse, 0.95 * haloPulse, 1);

      for (const s of flameSprites) {
        const d = s.userData;
        const wave = Math.sin(t * d.speed + d.phase);
        s.scale.x = d.sx * (1 + Math.sin(t * 2.6 + d.phase) * 0.14);
        s.scale.y = d.sy * (1 + Math.abs(wave) * 0.22);
        s.material.opacity = d.opacity * (0.78 + 0.22 * Math.sin(t * 3.7 + d.phase));
      }
    },
  };
}

// ── Contact scene helpers ───────────────────────────────────
function createCastleEveningSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(51823);

  // Late evening: deep blue zenith, hint of warm amber near horizon
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#070b1c');
  gradient.addColorStop(0.32, '#0f1933');
  gradient.addColorStop(0.55, '#1a2748');
  gradient.addColorStop(0.74, '#2c3252');
  gradient.addColorStop(0.88, '#3a3148');
  gradient.addColorStop(1, '#1a131c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint stars near the top
  for (let i = 0; i < 220; i++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height * 0.5;
    const r = random() * 1.2 + 0.18;
    const a = 0.18 + random() * 0.45;
    ctx.fillStyle = `rgba(${190 + Math.floor(random() * 50)}, ${200 + Math.floor(random() * 40)}, 255, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft horizon glow
  const horizon = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
  horizon.addColorStop(0, 'rgba(120, 80, 70, 0)');
  horizon.addColorStop(0.6, 'rgba(180, 110, 70, 0.08)');
  horizon.addColorStop(1, 'rgba(20, 14, 22, 0.55)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft cloud bands
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(36px)';
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(80, 96, 142, ${0.08 + random() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(
      random() * canvas.width,
      canvas.height * (0.32 + random() * 0.28),
      220 + random() * 320,
      30 + random() * 70,
      (random() - 0.5) * 0.28,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function createCastleWallTextureSet() {
  // Hewn-stone masonry: rectangular blocks staggered in courses with mortar gaps
  const w = 1024;
  const h = 512;
  const colorCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = roughCanvas.width = bumpCanvas.width = w;
  colorCanvas.height = roughCanvas.height = bumpCanvas.height = h;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const random = seededRandom(73219);

  // Mortar base — dark, slightly recessed
  colorCtx.fillStyle = '#222732';
  colorCtx.fillRect(0, 0, w, h);
  roughCtx.fillStyle = 'rgb(238, 238, 238)';
  roughCtx.fillRect(0, 0, w, h);
  bumpCtx.fillStyle = 'rgb(48, 48, 48)';
  bumpCtx.fillRect(0, 0, w, h);

  const courseHeight = 78;
  const blockWidth = 132;
  const mortar = 5;

  for (let row = 0; row * courseHeight < h + courseHeight; row++) {
    const offset = row % 2 === 0 ? 0 : blockWidth / 2;
    for (let col = -1; col * blockWidth + offset < w + blockWidth; col++) {
      const bx = col * blockWidth + offset;
      const by = row * courseHeight;
      const bw = blockWidth - mortar * 2 + (random() - 0.5) * 8;
      const bh = courseHeight - mortar * 2 + (random() - 0.5) * 6;
      const x = bx + mortar + (random() - 0.5) * 2;
      const y = by + mortar + (random() - 0.5) * 2;

      // Block tone — cool grey-blue with slight per-block variance
      const tone = 100 + random() * 36;
      const r = tone + (random() - 0.5) * 14;
      const g = tone + 4 + (random() - 0.5) * 10;
      const b = tone + 18 + (random() - 0.5) * 12;

      // Block face with slight chipped corners
      colorCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      colorCtx.fillRect(x, y, bw, bh);

      // Bevel highlight (top-left edge)
      colorCtx.fillStyle = `rgba(${r + 22}, ${g + 22}, ${b + 22}, 0.42)`;
      colorCtx.fillRect(x, y, bw, 2);
      colorCtx.fillRect(x, y, 2, bh);

      // Bevel shadow (bottom-right edge)
      colorCtx.fillStyle = `rgba(${Math.max(0, r - 28)}, ${Math.max(0, g - 28)}, ${Math.max(0, b - 28)}, 0.5)`;
      colorCtx.fillRect(x, y + bh - 2, bw, 2);
      colorCtx.fillRect(x + bw - 2, y, 2, bh);

      // Fine pitting / weathering
      colorCtx.save();
      colorCtx.globalAlpha = 0.16;
      for (let s = 0; s < 12; s++) {
        const sx = x + random() * bw;
        const sy = y + random() * bh;
        colorCtx.fillStyle = `rgb(${30 + random() * 50}, ${34 + random() * 50}, ${50 + random() * 50})`;
        colorCtx.fillRect(sx, sy, 1 + random() * 2.5, 1 + random() * 2);
      }
      colorCtx.restore();

      // Occasional moss patch in mortar joints
      if (random() > 0.86) {
        colorCtx.save();
        colorCtx.globalAlpha = 0.4;
        colorCtx.fillStyle = `rgb(${36 + random() * 18}, ${64 + random() * 26}, ${42 + random() * 16})`;
        colorCtx.beginPath();
        colorCtx.ellipse(
          x + random() * bw,
          y + bh - 2 + random() * 4,
          4 + random() * 8,
          2 + random() * 3,
          0,
          0,
          Math.PI * 2
        );
        colorCtx.fill();
        colorCtx.restore();
      }

      // Bump map: blocks stand proud of mortar
      bumpCtx.fillStyle = `rgb(${188 + random() * 28}, ${188 + random() * 28}, ${188 + random() * 28})`;
      bumpCtx.fillRect(x, y, bw, bh);

      // Roughness: smoother face than mortar
      roughCtx.fillStyle = `rgb(${204 + random() * 28}, ${204 + random() * 28}, ${204 + random() * 28})`;
      roughCtx.fillRect(x, y, bw, bh);
    }
  }

  // Subtle final noise to break up tiling artifacts
  const colorImage = colorCtx.getImageData(0, 0, w, h);
  for (let i = 0; i < colorImage.data.length; i += 4) {
    const noise = (random() - 0.5) * 12;
    colorImage.data[i] = Math.max(0, Math.min(255, colorImage.data[i] + noise));
    colorImage.data[i + 1] = Math.max(0, Math.min(255, colorImage.data[i + 1] + noise));
    colorImage.data[i + 2] = Math.max(0, Math.min(255, colorImage.data[i + 2] + noise));
  }
  colorCtx.putImageData(colorImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    t.repeat.set(8, 1.2);
  });
  return { color, roughness, bump };
}

function createCastleTrimTextureSet() {
  // Larger, darker plinth/cornice blocks — flatter and rougher
  const w = 1024;
  const h = 256;
  const colorCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = roughCanvas.width = bumpCanvas.width = w;
  colorCanvas.height = roughCanvas.height = bumpCanvas.height = h;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const random = seededRandom(38197);

  colorCtx.fillStyle = '#1a1d24';
  colorCtx.fillRect(0, 0, w, h);
  roughCtx.fillStyle = 'rgb(244, 244, 244)';
  roughCtx.fillRect(0, 0, w, h);
  bumpCtx.fillStyle = 'rgb(50, 50, 50)';
  bumpCtx.fillRect(0, 0, w, h);

  const courseHeight = h;
  const blockWidth = 256;
  const mortar = 7;

  for (let col = -1; col * blockWidth < w + blockWidth; col++) {
    const x = col * blockWidth + mortar + (random() - 0.5) * 4;
    const y = mortar + (random() - 0.5) * 2;
    const bw = blockWidth - mortar * 2 + (random() - 0.5) * 10;
    const bh = courseHeight - mortar * 2;
    const tone = 86 + random() * 28;
    const r = tone + (random() - 0.5) * 10;
    const g = tone + 4 + (random() - 0.5) * 10;
    const b = tone + 14 + (random() - 0.5) * 12;
    colorCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    colorCtx.fillRect(x, y, bw, bh);

    // Edge bevels
    colorCtx.fillStyle = `rgba(${r + 20}, ${g + 20}, ${b + 20}, 0.4)`;
    colorCtx.fillRect(x, y, bw, 3);
    colorCtx.fillStyle = `rgba(${Math.max(0, r - 26)}, ${Math.max(0, g - 26)}, ${Math.max(0, b - 26)}, 0.46)`;
    colorCtx.fillRect(x, y + bh - 3, bw, 3);

    // Pits
    colorCtx.save();
    colorCtx.globalAlpha = 0.18;
    for (let s = 0; s < 24; s++) {
      colorCtx.fillStyle = `rgb(${30 + random() * 40}, ${34 + random() * 40}, ${48 + random() * 40})`;
      colorCtx.fillRect(x + random() * bw, y + random() * bh, 1 + random() * 2, 1 + random() * 2);
    }
    colorCtx.restore();

    bumpCtx.fillStyle = `rgb(${168 + random() * 22}, ${168 + random() * 22}, ${168 + random() * 22})`;
    bumpCtx.fillRect(x, y, bw, bh);
    roughCtx.fillStyle = `rgb(${214 + random() * 22}, ${214 + random() * 22}, ${214 + random() * 22})`;
    roughCtx.fillRect(x, y, bw, bh);
  }

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    t.repeat.set(10, 1);
  });
  return { color, roughness, bump };
}

function createCastleFloorTextureSet() {
  // Long rectangular flagstones laid in a running-bond pattern (each row
  // offset by half a stone). Clearly read as stone slabs, not jittered tiles.
  const size = 1024;
  const colorCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = roughCanvas.width = bumpCanvas.width = size;
  colorCanvas.height = roughCanvas.height = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const random = seededRandom(64217);

  // Mortar background — dark and slightly recessed
  colorCtx.fillStyle = '#181b22';
  colorCtx.fillRect(0, 0, size, size);
  roughCtx.fillStyle = 'rgb(244, 244, 244)';
  roughCtx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = 'rgb(54, 54, 54)';
  bumpCtx.fillRect(0, 0, size, size);

  // Stone dimensions — each course is half as tall as it is wide
  const stoneW = 256; // four stones per row width
  const stoneH = 128; // eight courses tall
  const mortar = 5;

  for (let row = 0; row * stoneH < size + stoneH; row++) {
    const offset = row % 2 === 0 ? 0 : stoneW / 2;
    for (let col = -1; col * stoneW + offset < size + stoneW; col++) {
      const x = col * stoneW + offset + mortar;
      const y = row * stoneH + mortar;
      const sw = stoneW - mortar * 2;
      const sh = stoneH - mortar * 2;

      // Cool grey-blue stone tone with subtle variance
      const tone = 100 + random() * 28;
      const r = tone + (random() - 0.5) * 10;
      const g = tone + 4 + (random() - 0.5) * 10;
      const b = tone + 18 + (random() - 0.5) * 12;

      // Stone face
      colorCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      colorCtx.fillRect(x, y, sw, sh);

      // Bevel highlight (top + left)
      colorCtx.fillStyle = `rgba(${r + 22}, ${g + 22}, ${b + 22}, 0.42)`;
      colorCtx.fillRect(x, y, sw, 2);
      colorCtx.fillRect(x, y, 2, sh);

      // Bevel shadow (bottom + right)
      colorCtx.fillStyle = `rgba(${Math.max(0, r - 28)}, ${Math.max(0, g - 28)}, ${Math.max(0, b - 28)}, 0.5)`;
      colorCtx.fillRect(x, y + sh - 2, sw, 2);
      colorCtx.fillRect(x + sw - 2, y, 2, sh);

      // Faint diagonal crack on some stones
      if (random() > 0.7) {
        colorCtx.save();
        colorCtx.globalAlpha = 0.45;
        colorCtx.strokeStyle = `rgba(${24 + random() * 24}, ${28 + random() * 24}, ${44 + random() * 24}, 0.85)`;
        colorCtx.lineWidth = 1 + random() * 0.6;
        colorCtx.beginPath();
        const sx = x + random() * sw;
        const sy = y + random() * sh;
        colorCtx.moveTo(sx, sy);
        for (let k = 0; k < 3; k++) {
          colorCtx.lineTo(sx + (random() - 0.4) * sw * 0.7, sy + (random() - 0.4) * sh * 0.7);
        }
        colorCtx.stroke();
        colorCtx.restore();
      }

      // Pitting / weathering specks
      colorCtx.save();
      colorCtx.globalAlpha = 0.18;
      for (let s = 0; s < 28; s++) {
        colorCtx.fillStyle = `rgb(${30 + random() * 40}, ${34 + random() * 40}, ${52 + random() * 40})`;
        colorCtx.fillRect(x + random() * sw, y + random() * sh, 1 + random() * 2.5, 1 + random() * 2);
      }
      colorCtx.restore();

      // Damp moss in joints occasionally
      if (random() > 0.82) {
        colorCtx.save();
        colorCtx.globalAlpha = 0.42;
        colorCtx.fillStyle = `rgb(${30 + random() * 16}, ${58 + random() * 24}, ${42 + random() * 16})`;
        colorCtx.beginPath();
        colorCtx.ellipse(
          x + random() * sw,
          y + sh - 1 + random() * 4,
          4 + random() * 10,
          2 + random() * 3,
          0,
          0,
          Math.PI * 2
        );
        colorCtx.fill();
        colorCtx.restore();
      }

      bumpCtx.fillStyle = `rgb(${188 + random() * 22}, ${188 + random() * 22}, ${188 + random() * 22})`;
      bumpCtx.fillRect(x, y, sw, sh);
      roughCtx.fillStyle = `rgb(${204 + random() * 24}, ${204 + random() * 24}, ${204 + random() * 24})`;
      roughCtx.fillRect(x, y, sw, sh);
    }
  }

  // Subtle final color noise to break up tiling
  const colorImage = colorCtx.getImageData(0, 0, size, size);
  for (let i = 0; i < colorImage.data.length; i += 4) {
    const noise = (random() - 0.5) * 10;
    colorImage.data[i] = Math.max(0, Math.min(255, colorImage.data[i] + noise));
    colorImage.data[i + 1] = Math.max(0, Math.min(255, colorImage.data[i + 1] + noise));
    colorImage.data[i + 2] = Math.max(0, Math.min(255, colorImage.data[i + 2] + noise));
  }
  colorCtx.putImageData(colorImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    t.repeat.set(4, 4);
  });
  return { color, roughness, bump };
}

function createWallTorch() {
  const group = new THREE.Group();

  const ironMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2a26,
    roughness: 0.5,
    metalness: 0.78,
  });
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d3522,
    roughness: 0.92,
    metalness: 0.04,
  });
  const pitchMaterial = new THREE.MeshStandardMaterial({
    color: 0x281408,
    emissive: 0xff5a14,
    emissiveIntensity: 0.6,
    roughness: 0.62,
    metalness: 0.1,
  });

  // Bracket attached to wall — local +Z faces inward (toward room center)
  const backplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.34, 0.06),
    ironMaterial
  );
  backplate.position.z = -0.02;
  backplate.castShadow = true;
  backplate.receiveShadow = true;
  group.add(backplate);

  // Curved arm out from the wall — approximated with two short segments
  const arm1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.06, 0.18),
    ironMaterial
  );
  arm1.position.set(0, 0.05, 0.07);
  arm1.rotation.x = -0.35;
  arm1.castShadow = true;
  group.add(arm1);

  const arm2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.04, 0.16),
    ironMaterial
  );
  arm2.position.set(0, 0.18, 0.18);
  arm2.rotation.x = 0.55;
  arm2.castShadow = true;
  group.add(arm2);

  // Iron cup that holds the torch shaft
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.045, 0.1, 14),
    ironMaterial
  );
  cup.position.set(0, 0.27, 0.24);
  cup.castShadow = true;
  group.add(cup);

  // Wooden shaft
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.024, 0.4, 12),
    woodMaterial
  );
  shaft.position.set(0, 0.49, 0.24);
  shaft.castShadow = true;
  group.add(shaft);

  // Pitch / cloth top — the burning bit
  const pitch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.026, 0.13, 12),
    pitchMaterial
  );
  pitch.position.set(0, 0.74, 0.24);
  group.add(pitch);

  // Flame layered sprites + halo + point light
  const flameTexture = createGraceFlameTexture();
  const flameGroup = new THREE.Group();
  flameGroup.position.set(0, 0.9, 0.24);

  const wisps = [
    { sx: 0.22, sy: 0.5, color: 0xff7a1c, opacity: 0.96, phase: 0, speed: 1.5, offsetY: 0.1 },
    { sx: 0.16, sy: 0.36, color: 0xffaa3c, opacity: 0.88, phase: 1.2, speed: 1.85, offsetY: 0.06 },
    { sx: 0.12, sy: 0.26, color: 0xffd968, opacity: 0.78, phase: 2.4, speed: 2.1, offsetY: 0.02 },
  ];
  const flameSprites = [];
  for (const w of wisps) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flameTexture,
        color: w.color,
        transparent: true,
        opacity: w.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sprite.position.set(0, w.offsetY, 0);
    sprite.scale.set(w.sx, w.sy, 1);
    sprite.userData = { ...w };
    flameSprites.push(sprite);
    flameGroup.add(sprite);
  }
  group.add(flameGroup);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialGlowTexture('rgba(255, 152, 64, 0.95)'),
      color: 0xff8a36,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.position.set(0, 0.9, 0.24);
  halo.scale.set(0.95, 0.95, 1);
  group.add(halo);

  const flameLight = new THREE.PointLight(0xff8a36, 4.2, 4.6, 1.7);
  flameLight.position.set(0, 0.9, 0.24);
  flameLight.castShadow = false;
  group.add(flameLight);

  return {
    group,
    light: flameLight,
    sprites: flameSprites,
    halo,
    update: (t) => {
      const seed = group.position.x * 1.3 + group.position.z * 0.7;
      const flicker =
        Math.sin(t * 7.2 + seed) * 0.32 +
        Math.sin(t * 13.1 + seed * 0.6) * 0.18 +
        Math.sin(t * 23.4 + seed * 0.3) * 0.08;
      flameLight.intensity = 4.0 + flicker * 0.9;
      halo.material.opacity = 0.5 + flicker * 0.18;
      const haloPulse = 1 + Math.sin(t * 3.4 + seed) * 0.08;
      halo.scale.set(0.95 * haloPulse, 0.95 * haloPulse, 1);

      for (const s of flameSprites) {
        const d = s.userData;
        const wave = Math.sin(t * d.speed + d.phase + seed);
        s.scale.x = d.sx * (1 + Math.sin(t * 2.6 + d.phase) * 0.14);
        s.scale.y = d.sy * (1 + Math.abs(wave) * 0.22);
        s.material.opacity = d.opacity * (0.78 + 0.22 * Math.sin(t * 3.7 + d.phase));
      }
    },
  };
}

function createWoodSignTextureSet() {
  const w = 256;
  const h = 1024;
  const colorCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = roughCanvas.width = bumpCanvas.width = w;
  colorCanvas.height = roughCanvas.height = bumpCanvas.height = h;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(w, h);
  const roughImage = roughCtx.createImageData(w, h);
  const bumpImage = bumpCtx.createImageData(w, h);
  const random = seededRandom(91232);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Vertical grain — slow drift along x
      const drift = Math.sin(y * 0.0035) * 1.6;
      const grain = Math.sin((x + drift) * 0.18 + Math.sin(y * 0.012) * 1.5) * 0.5 + 0.5;
      const ringDarkness = Math.pow(Math.abs(Math.sin((x + drift) * 0.04 + y * 0.001)), 6) * 0.6;
      const speck = random() * 0.18;
      const value = 96 + grain * 18 - ringDarkness * 28 + speck * 10;
      const v = Math.max(54, Math.min(154, value));
      colorImage.data[i] = v + 22;
      colorImage.data[i + 1] = v - 4;
      colorImage.data[i + 2] = v - 26;
      colorImage.data[i + 3] = 255;

      const r = 222 + random() * 22 - ringDarkness * 26;
      roughImage.data[i] = r;
      roughImage.data[i + 1] = r;
      roughImage.data[i + 2] = r;
      roughImage.data[i + 3] = 255;

      const b = 110 + grain * 36 - ringDarkness * 50 + random() * 20;
      bumpImage.data[i] = b;
      bumpImage.data[i + 1] = b;
      bumpImage.data[i + 2] = b;
      bumpImage.data[i + 3] = 255;
    }
  }
  colorCtx.putImageData(colorImage, 0, 0);
  roughCtx.putImageData(roughImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const roughness = new THREE.CanvasTexture(roughCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  [color, roughness, bump].forEach((t) => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  });
  return { color, roughness, bump };
}

function createSignBoardTexture() {
  const w = 1024;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(40123);

  // Wood gradient base
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#6c4421');
  grad.addColorStop(0.45, '#7a4f2c');
  grad.addColorStop(1, '#553a1d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Plank gap line down the middle (subtle)
  ctx.fillStyle = 'rgba(20, 12, 4, 0.3)';
  ctx.fillRect(w / 2 - 1, 0, 2, h);

  // Wood grain
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#3b2810';
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1 + random() * 2;
    const y = i * (h / 30) + (random() - 0.5) * 12;
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 28) {
      ctx.lineTo(x, y + Math.sin(x * 0.012 + i * 0.3) * 4 + (random() - 0.5) * 1.5);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Knots
  for (let i = 0; i < 5; i++) {
    const x = random() * w;
    const y = random() * h;
    const r = 8 + random() * 22;
    const knot = ctx.createRadialGradient(x, y, 0, x, y, r);
    knot.addColorStop(0, 'rgba(34, 20, 8, 0.92)');
    knot.addColorStop(0.55, 'rgba(58, 36, 14, 0.42)');
    knot.addColorStop(1, 'rgba(70, 44, 18, 0)');
    ctx.fillStyle = knot;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Iron rivets in corners
  const rivetXY = [[64, 60], [w - 64, 60], [64, h - 60], [w - 64, h - 60]];
  for (const [x, y] of rivetXY) {
    const rivet = ctx.createRadialGradient(x, y, 0, x, y, 18);
    rivet.addColorStop(0, '#3b3a36');
    rivet.addColorStop(0.6, '#1c1b18');
    rivet.addColorStop(1, 'rgba(8, 8, 6, 0)');
    ctx.fillStyle = rivet;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Carved/burned title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 132px "Cormorant Garamond", "Times New Roman", Georgia, serif';
  ctx.shadowColor = 'rgba(8, 4, 0, 0.8)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#1a0e04';
  ctx.fillText('Send Word', w / 2, h * 0.4);

  // Subtitle
  ctx.font = '500 56px "Cormorant Garamond", Georgia, serif';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#2a1a08';
  ctx.fillText('— Roundtable Hold —', w / 2, h * 0.6);

  // Hint
  ctx.shadowBlur = 0;
  ctx.font = 'italic 38px Georgia, serif';
  ctx.fillStyle = '#3e2710';
  ctx.fillText('click to read', w / 2, h * 0.78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

function createWoodSign() {
  const group = new THREE.Group();
  const woodTex = createWoodSignTextureSet();
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a6035,
    map: woodTex.color,
    roughnessMap: woodTex.roughness,
    bumpMap: woodTex.bump,
    bumpScale: 0.06,
    roughness: 0.9,
    metalness: 0.04,
  });
  const darkWoodMaterial = woodMaterial.clone();
  darkWoodMaterial.color = new THREE.Color(0x593a1a);
  const ironMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3832,
    roughness: 0.55,
    metalness: 0.78,
  });
  const ropeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3a22,
    roughness: 0.95,
    metalness: 0,
  });

  // Vertical post planted in the ground
  const postHeight = 2.0;
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.072, postHeight, 14),
    woodMaterial
  );
  post.position.y = postHeight / 2;
  post.castShadow = true;
  post.receiveShadow = true;
  group.add(post);

  // Ornamental cap on top of the post
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    darkWoodMaterial
  );
  cap.position.y = postHeight;
  cap.castShadow = true;
  group.add(cap);

  // Horizontal cross-arm near the top
  const armWidth = 1.25;
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(armWidth, 0.09, 0.11),
    woodMaterial
  );
  arm.position.y = postHeight - 0.12;
  arm.castShadow = true;
  arm.receiveShadow = true;
  group.add(arm);

  // Iron caps on the cross-arm ends
  for (const x of [-armWidth / 2, armWidth / 2]) {
    const armCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.13, 0.14),
      ironMaterial
    );
    armCap.position.set(x, postHeight - 0.12, 0);
    armCap.castShadow = true;
    group.add(armCap);
  }

  // Sign board hanging below the cross-arm
  const boardWidth = 1.05;
  const boardHeight = 0.78;
  const boardTexture = createSignBoardTexture();
  const boardFaceMaterial = new THREE.MeshStandardMaterial({
    map: boardTexture,
    roughness: 0.88,
    metalness: 0.02,
    bumpMap: woodTex.bump,
    bumpScale: 0.05,
    emissive: 0x1c1408,
    emissiveIntensity: 0.06,
  });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth, boardHeight, 0.045),
    [woodMaterial, woodMaterial, woodMaterial, woodMaterial, boardFaceMaterial, woodMaterial]
  );
  board.position.y = postHeight - 0.7;
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);

  // Two ropes connecting the board to the cross-arm
  for (const x of [-0.45, 0.45]) {
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.34, 8),
      ropeMaterial
    );
    rope.position.set(x, postHeight - 0.28, 0);
    group.add(rope);

    // Tied knot at the rope's bottom end
    const knot = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 8),
      ropeMaterial
    );
    knot.position.set(x, postHeight - 0.42, 0);
    group.add(knot);

    // Iron eye where the rope meets the board
    const eye = new THREE.Mesh(
      new THREE.TorusGeometry(0.022, 0.005, 6, 14),
      ironMaterial
    );
    eye.rotation.x = Math.PI / 2;
    eye.position.set(x, postHeight - 0.4, 0.015);
    group.add(eye);
  }

  return group;
}

function createContactReaderOverlay(content, onClose) {
  const app = document.getElementById('app');
  const overlay = document.createElement('section');
  overlay.className = 'tablet-reader contact-reader';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `${content.title} contact information`);

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

  if (content.intro) {
    const p = document.createElement('p');
    p.textContent = content.intro;
    body.append(p);
  }

  const list = document.createElement('ul');
  list.className = 'contact-reader__list';
  for (const link of content.links ?? []) {
    const item = document.createElement('li');
    item.className = 'contact-reader__item';

    const label = document.createElement('span');
    label.className = 'contact-reader__label';
    label.textContent = link.label;

    const anchor = document.createElement('a');
    anchor.className = 'contact-reader__link';
    anchor.textContent = link.value;
    anchor.href = link.href;
    if (!link.href.startsWith('mailto:')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }

    item.append(label, anchor);
    list.append(item);
  }
  body.append(list);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) onClose();
  });

  panel.append(closeButton, eyebrow, title, body);
  overlay.append(panel);
  app?.append(overlay);
  return overlay;
}
