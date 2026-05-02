import * as THREE from 'three';

const FOV = 58;
const NEAR = 0.1;
const FAR = 120;

export class SceneManager {
  renderer;
  camera;
  currentScene = null;

  #clock = new THREE.Clock();
  #pointer = new THREE.Vector2();
  #raycaster = new THREE.Raycaster();
  #onClick;
  #onPointerMove;

  constructor(root = document.getElementById('app')) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'three-renderer-canvas';

    this.camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
    this.camera.position.set(0, 1.2, 5.8);

    root.prepend(this.renderer.domElement);
    this.#resize();
    this.#onClick = this.#handleClick.bind(this);
    this.#onPointerMove = this.#handlePointerMove.bind(this);
    this.renderer.domElement.addEventListener('click', this.#onClick);
    this.renderer.domElement.addEventListener('pointermove', this.#onPointerMove);
    window.addEventListener('resize', () => this.#resize());
  }

  setScene(scene) {
    this.currentScene?.exit();
    this.currentScene = scene;
    this.renderer.domElement.style.cursor = '';
    this.#clock.getDelta();
    this.currentScene?.enter(this.camera);
  }

  render() {
    const delta = this.#clock.getDelta();
    const elapsed = this.#clock.elapsedTime;

    if (!this.currentScene) {
      this.renderer.clear();
      return;
    }

    this.currentScene.update(elapsed, delta);
    this.renderer.render(this.currentScene.scene, this.camera);
  }

  #resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
  }

  #handleClick(event) {
    if (!this.currentScene) return;

    const hit = this.#getFirstHit(event);
    if (hit) {
      this.currentScene.handleSceneClick?.(hit);
    } else {
      this.currentScene.handleSceneMiss?.();
    }
  }

  #handlePointerMove(event) {
    if (!this.currentScene) return;

    const hit = this.#getFirstHit(event);
    this.renderer.domElement.style.cursor = hit ? 'pointer' : '';
    this.currentScene.handleSceneHover?.(hit);
  }

  #getFirstHit(event) {
    const objects = this.currentScene?.getInteractiveObjects?.() ?? [];
    if (objects.length === 0) return null;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.#pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.#pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.#raycaster.setFromCamera(this.#pointer, this.camera);

    return this.#raycaster.intersectObjects(objects, true)[0] ?? null;
  }
}
