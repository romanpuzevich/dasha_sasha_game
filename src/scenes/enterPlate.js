// Плашка «Нажмите Enter, чтобы продолжить» после превью.
import { WORLD_W, WORLD_H, COLOR_BG, TEXTS } from '../game/constants.js';
import { drawPopup } from '../engine/ui.js';
import { scenes } from '../engine/scenes.js';
import { level1Scene } from './level1.js';

let leaving = false;

export const enterPlateScene = {
  init() {
    leaving = false;
  },

  update() {},

  render(ctx) {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    drawPopup(ctx, TEXTS.PRESS_ENTER, WORLD_H / 2);
  },

  onKey(code) {
    if (code !== 'Enter' || leaving) return;
    leaving = true;
    scenes.setScene(level1Scene);
  }
};
