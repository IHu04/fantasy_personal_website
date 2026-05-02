import { initCanvas } from './canvas.js';
import { initMap }    from './map.js';
import { SceneManager } from './SceneManager.js';

const sceneManager = new SceneManager();

initMap(sceneManager);
initCanvas(document.getElementById('bg-canvas'), {
  onFrame: () => sceneManager.render(),
});
