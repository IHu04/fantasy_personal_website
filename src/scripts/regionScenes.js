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
