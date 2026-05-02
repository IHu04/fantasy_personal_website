import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';

export class RegionScene {
  scene;
  cameraRig = null;

  #fadeTargets = [];
  #fade = 0;
  #isEntered = false;

  constructor(region, palette) {
    if (new.target === RegionScene) {
      throw new Error('RegionScene is abstract and must be extended.');
    }

    this.region = region;
    this.palette = palette;
    this.scene = new THREE.Scene();
    this.scene.name = `${region.name}Scene`;
  }

  init() {}

  enter(camera) {
    this.cameraRig = new CameraRig(camera);
    this.cameraRig.set(this.getCameraConfig());
    this.#fade = 0;
    this.#isEntered = true;
    this.#collectFadeTargets();
    this.#applyFade(0);
    this.startAmbientSounds();
  }

  exit() {
    this.#isEntered = false;
    this.stopAmbientSounds();
    this.cameraRig?.dispose?.();
    this.#applyFade(0);
  }

  update(t, dt) {
    if (!this.#isEntered) return;

    this.#fade = Math.min(1, this.#fade + dt * 1.8);
    this.#applyFade(this.#fade);
    this.cameraRig?.update(t);
  }

  dispose() {
    const materialsToDispose = new Set();
    const texturesToDispose = new Set();

    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();

      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value?.isTexture) texturesToDispose.add(value);
          }
          materialsToDispose.add(material);
        }
      }
    });

    for (const texture of texturesToDispose) texture.dispose();
    for (const material of materialsToDispose) material.dispose();
    this.scene.clear();
  }

  getCameraConfig() {
    return {
      position: [0, 1.2, 5.8],
      target: [0, 0, 0],
    };
  }

  startAmbientSounds() {}

  stopAmbientSounds() {}

  #collectFadeTargets() {
    this.#fadeTargets = [];
    const fadeTargets = new Set();
    this.scene.traverse((object) => {
      if (!object.material) return;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material.userData.baseOpacity === undefined) {
          material.userData.baseOpacity = material.opacity;
        }
        material.transparent = true;
        fadeTargets.add(material);
      }
    });
    this.#fadeTargets = [...fadeTargets];
  }

  #applyFade(value) {
    for (const material of this.#fadeTargets) {
      material.opacity = material.userData.baseOpacity * value;
    }
  }
}
