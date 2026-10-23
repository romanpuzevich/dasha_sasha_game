// Стартовый экран: заставка с названием игры (5 с), затем титры (5 с),
// после чего автоматически начинается превью 1. Enter — начать сразу.
import { WORLD_W, WORLD_H, COLOR_BG, COLOR_TEXT, COLOR_TEXT_DIM, TITLE, TEXTS } from '../game/constants.js';
import { drawText } from '../engine/render.js';
import { scenes } from '../engine/scenes.js';
import { preview1Scene } from './preview1.js';

let phase = 0;   // 0 — заставка, 1 — титры
let timer = 0;   // время текущей фазы, с
let leaving = false;

function goNext() {
  if (leaving) return;
  leaving = true;
  scenes.setScene(preview1Scene);
}

export const titleScene = {
  init() {
    phase = 0;
    timer = 0;
    leaving = false;
  },

  update(dt) {
    if (leaving) return;
    timer += dt;

    if (phase === 0 && timer >= TITLE.HOLD_TIME) {
      phase = 1;
      timer = 0;
    } else if (phase === 1 && timer >= TITLE.CREDITS_TIME) {
      goNext();
    }
  },

  render(ctx) {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    if (phase === 0) {
      drawText(ctx, TEXTS.TITLE_GAME, WORLD_W / 2, TITLE.TITLE_Y, {
        size: TITLE.TITLE_FONT,
        color: COLOR_TEXT
      });
      drawText(ctx, TEXTS.TITLE_START, WORLD_W / 2, WORLD_H - TITLE.HINT_BOTTOM, {
        size: TITLE.HINT_FONT,
        color: COLOR_TEXT_DIM
      });
    } else {
      drawText(ctx, TEXTS.TITLE_CREDITS, WORLD_W / 2, TITLE.CREDITS_Y, {
        size: TITLE.CREDITS_FONT,
        color: COLOR_TEXT
      });
    }
  },

  onKey(code) {
    if (code !== 'Enter' || leaving) return;
    goNext();
  }
};
