import { initCanvas } from './canvas.js';
import { initMap }    from './map.js';
import { SceneManager } from './SceneManager.js';

const sceneManager = new SceneManager();

const canvasFx = initCanvas(document.getElementById('bg-canvas'), {
  onFrame: () => sceneManager.render(),
});
initMap(sceneManager, { emitDust: canvasFx.emitDust });
