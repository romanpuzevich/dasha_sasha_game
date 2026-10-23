// Менеджер сцен: одна активная сцена + fade-переход 0.3 с.
// Интерфейс сцены: { init(), update(dt), render(ctx), onKey(code) }.
import { WORLD_W, WORLD_H } from '../game/constants.js';

const FADE_DURATION = 0.3; // длительность перехода, с

let currentScene = null;
let nextScene = null;                // сцена, ждущая конца затемнения
let fadeAlpha = 1;                   // 1 — экран чёрный, 0 — сцена видна
let fadeSpeed = -1 / FADE_DURATION;  // <0 — проявляемся, >0 — затемняемся, 0 — стоп

export const scenes = {
  // Сделать сцену активной. Первый вызов — сразу, с проявлением из чёрного.
  setScene(scene) {
    if (!currentScene) {
      currentScene = scene;
      fadeAlpha = 1;
      fadeSpeed = -1 / FADE_DURATION;
      currentScene.init();
      return;
    }

    nextScene = scene;
    fadeSpeed = 1 / FADE_DURATION; // уходим в чёрное, затем переключимся
  },

  getCurrent() {
    return currentScene;
  },

  update(dt) {
    if (fadeSpeed !== 0) {
      fadeAlpha += fadeSpeed * dt;

      if (fadeAlpha >= 1) {
        fadeAlpha = 1;
        if (nextScene) {
          // Затемнение закончилось: входим в новую сцену и проявляемся
          currentScene = nextScene;
          nextScene = null;
          currentScene.init();
          fadeSpeed = -1 / FADE_DURATION;
        } else {
          fadeSpeed = 0;
        }
      } else if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeSpeed = 0;
      }
    }

    if (currentScene) currentScene.update(dt);
  },

  render(ctx) {
    if (currentScene) currentScene.render(ctx);

    // Чёрная вуаль поверх мира
    if (fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  },

  // Прокинуть код клавиши активной сцене
  handleKey(code) {
    if (currentScene && currentScene.onKey) currentScene.onKey(code);
  }
};
