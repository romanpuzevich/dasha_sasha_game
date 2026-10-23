// Уровень 3 — пока заглушка-анонс (реальный геймплей появится позже).
// Чёрный экран в стиле титула: три строки анонса по центру (лёгкий fade-in)
// и мелкая подсказка внизу. Enter — возврат на стартовый экран.
// Тексты, позиции, шрифты и тайминги — LEVEL3 (constants.js).
import { WORLD_W, WORLD_H, COLOR_BG, COLOR_TEXT, COLOR_TEXT_DIM, LEVEL3 } from '../game/constants.js';
import { drawText } from '../engine/render.js';
import { scenes } from '../engine/scenes.js';
import { titleScene } from './title.js';

let fade = 0;        // 0..1 — проявление текста, с
let leaving = false; // защита от повторного Enter: уходим ровно один раз

function goTitle() {
  if (leaving) return;
  leaving = true;
  scenes.setScene(titleScene);
}

export const level3Scene = {
  init() {
    fade = 0;
    leaving = false;
  },

  update(dt) {
    if (leaving) return;
    fade = Math.min(1, fade + dt / LEVEL3.FADE_IN);
  },

  render(ctx) {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.globalAlpha = fade;
    LEVEL3.LINES.forEach((line, i) => {
      drawText(ctx, line, WORLD_W / 2, LEVEL3.LINE_Y + i * LEVEL3.LINE_H, {
        size: LEVEL3.FONT,
        color: COLOR_TEXT
      });
    });
    drawText(ctx, LEVEL3.HINT, WORLD_W / 2, WORLD_H - LEVEL3.HINT_BOTTOM, {
      size: LEVEL3.HINT_FONT,
      color: COLOR_TEXT_DIM
    });
    ctx.globalAlpha = 1;
  },

  onKey(code) {
    if (code === 'Enter' || code === 'NumpadEnter') goTitle();
  }
};
