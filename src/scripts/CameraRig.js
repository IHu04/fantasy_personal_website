import * as THREE from 'three';

export class CameraRig {
  #camera;
  #target = new THREE.Vector3();
  #basePosition = new THREE.Vector3(0, 1.2, 5.8);
  #orbitRadius = 0.22;
  #orbitSpeed = 0.16;
  #bobAmount = 0.055;
  #bobSpeed = 0.55;
  #orbitDegrees = null;
  #orbitDuration = 30;
  #mouseInfluence = 0;
  #pointer = new THREE.Vector2();
  #smoothedPointer = new THREE.Vector2();
  #onPointerMove;

  constructor(camera) {
    this.#camera = camera;
    this.#onPointerMove = this.#handlePointerMove.bind(this);
  }

  get camera() {
    return this.#camera;
  }

  set({
    position = [0, 1.2, 5.8],
    target = [0, 0, 0],
    orbitRadius = 0.22,
    orbitSpeed = 0.16,
    orbitDegrees = null,
    orbitDuration = 30,
    mouseInfluence = 0,
    bobAmount = 0.055,
    bobSpeed = 0.55,
  } = {}) {
    this.#basePosition.set(...position);
    this.#target.set(...target);
    this.#orbitRadius = orbitRadius;
    this.#orbitSpeed = orbitSpeed;
    this.#orbitDegrees = orbitDegrees;
    this.#orbitDuration = orbitDuration;
    this.#mouseInfluence = mouseInfluence;
    this.#bobAmount = bobAmount;
    this.#bobSpeed = bobSpeed;
    this.#pointer.set(0, 0);
    this.#smoothedPointer.set(0, 0);
    this.#camera.zoom = 1;
    this.#camera.updateProjectionMatrix();
    window.removeEventListener('pointermove', this.#onPointerMove);
    if (this.#mouseInfluence > 0) {
      window.addEventListener('pointermove', this.#onPointerMove);
    }
    this.update(0);
  }

  update(t) {
    this.#smoothedPointer.lerp(this.#pointer, 0.06);

    if (this.#orbitDegrees !== null) {
      const offset = this.#basePosition.clone().sub(this.#target);
      const angle = THREE.MathUtils.degToRad(this.#orbitDegrees) * (t / this.#orbitDuration);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      this.#camera.position.copy(this.#target).add(offset);
      this.#camera.position.y += Math.sin(t * this.#bobSpeed) * this.#bobAmount;
      this.#applyMouseOffset();
      this.#camera.lookAt(this.#target);
      return;
    }

    const orbit = t * this.#orbitSpeed;
    this.#camera.position.set(
      this.#basePosition.x + Math.sin(orbit) * this.#orbitRadius,
      this.#basePosition.y + Math.sin(t * this.#bobSpeed) * this.#bobAmount,
      this.#basePosition.z + Math.cos(orbit) * this.#orbitRadius
    );
    this.#applyMouseOffset();
    this.#camera.lookAt(this.#target);
  }

  #applyMouseOffset() {
    if (this.#mouseInfluence <= 0) return;

    this.#camera.position.x += this.#smoothedPointer.x * this.#mouseInfluence;
    this.#camera.position.y += this.#smoothedPointer.y * this.#mouseInfluence * 0.36;
  }

  #handlePointerMove(event) {
    this.#pointer.set(
      (event.clientX / window.innerWidth - 0.5) * 2,
      -(event.clientY / window.innerHeight - 0.5) * 2
    );
  }

  dispose() {
    window.removeEventListener('pointermove', this.#onPointerMove);
  }
}
