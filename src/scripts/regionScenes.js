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
    // Hover/focus brightens the etched text
    const target = isFocused ? 2.2 : isHovered ? 1.55 : this.baseEmissive;
    this.textMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      this.textMaterial.emissiveIntensity,
      target,
      0.09
    );
    // Subtle breathing on the etched glyphs
    this.textMaterial.emissiveIntensity += Math.sin(t * 1.4 + this.position.x * 0.7) * 0.05;
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
