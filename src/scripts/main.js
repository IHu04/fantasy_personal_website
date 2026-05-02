import { initCanvas } from './canvas.js';
import { initMap }    from './map.js';
import { SceneManager } from './SceneManager.js';

const sceneManager = new SceneManager();

const canvasFx = initCanvas(document.getElementById('bg-canvas'), {
  onFrame: () => sceneManager.render(),
});
initMap(sceneManager, { emitDust: canvasFx.emitDust });
initIntroScreen();

function initIntroScreen() {
  const app = document.getElementById('app');
  const intro = document.getElementById('intro-screen');
  const playButton = document.getElementById('intro-play');
  if (!app || !intro || !playButton) return;
  app.classList.add('is-intro-active');
  const unlockDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 760;
  const revealDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1700;

  const openIntro = () => {
    if (intro.classList.contains('is-unlocking')) return;

    intro.classList.add('is-unlocking');
    playButton.disabled = true;

    window.setTimeout(() => {
      app.classList.add('is-intro-revealing');
      intro.classList.add('is-opening');
      intro.setAttribute('aria-hidden', 'true');
    }, unlockDuration);

    window.setTimeout(() => {
      intro.hidden = true;
      app.classList.remove('is-intro-active', 'is-intro-revealing');
    }, unlockDuration + revealDuration);
  };

  playButton.addEventListener('click', openIntro);
}
