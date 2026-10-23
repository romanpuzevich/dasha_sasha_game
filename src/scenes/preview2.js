// Превью 2 — «Коридор»: вертикальный коридор уходит вверх (вдаль).
// Стены слева/справа (тёмные, по ~200 px), пол по центру (светло-бежевый);
// двери на стенах: слева «Немецкий» и «Китайский», справа «Английский»
// и «Французский», таблички — над полотном. Герои стоят внизу, лицом
// вверх; «выбор» — имитация мышки (два клика по двери «Английский»).
// Все координаты — явные (x дверей в constants.js), зеркальных transform нет.
import {
  WORLD_W, WORLD_H,
  PREVIEW2, TEXTS, COLORS,
  COLOR_CORRIDOR_WALL, COLOR_CORRIDOR_FLOOR, COLOR_BASEBOARD,
  COLOR_CORRIDOR_DOOR, COLOR_CORRIDOR_DOOR_DARK,
  COLOR_SIGN, COLOR_SIGN_TEXT
} from '../game/constants.js';
import { createHeroes } from '../game/players.js';
import { drawCharacter, drawText } from '../engine/render.js';
import { createCutscene } from '../engine/cutscene.js';
import { scenes } from '../engine/scenes.js';
import { enterPlateScene } from './enterPlate.js';

let heroes = null;
let cutscene = null;
let leaving = false;

function goNext() {
  if (leaving) return;
  leaving = true;
  scenes.setScene(enterPlateScene);
}

// Геометрия двери: полотно на стене (x..x+DOOR_W, y..y+DOOR_H),
// ручка со стороны коридора, табличка по центру НАД полотном
function doorFace(door) {
  const left = door.side === 'left';
  return {
    x: door.x,
    y: door.y,
    w: PREVIEW2.DOOR_W,
    h: PREVIEW2.DOOR_H,
    handleX: left ? door.x + PREVIEW2.DOOR_W - 14 : door.x + 8,
    signX: door.x + PREVIEW2.DOOR_W / 2 - PREVIEW2.SIGN_W / 2,
    signY: door.y - PREVIEW2.SIGN_H - PREVIEW2.SIGN_GAP
  };
}

// Одна дверь на стене коридора: рама, полотно (или подсветка),
// ручка и табличка с названием над дверью
function drawDoor(ctx, door, highlight) {
  const f = doorFace(door);

  // Наличник и полотно (зелёное, если дверь выбрана)
  ctx.fillStyle = COLOR_CORRIDOR_DOOR_DARK;
  ctx.fillRect(f.x - 4, f.y - 4, f.w + 8, f.h + 8);
  ctx.fillStyle = highlight ? highlight.color : COLOR_CORRIDOR_DOOR;
  ctx.fillRect(f.x, f.y, f.w, f.h);

  // Вспышка поверх полотна (клик)
  if (highlight && highlight.flash > 0) {
    ctx.globalAlpha = highlight.flash * 0.55;
    ctx.fillStyle = COLORS.FLASH_WHITE;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.globalAlpha = 1;
  }

  // Ручка у края, обращённого к коридору
  ctx.fillStyle = COLOR_SIGN;
  ctx.fillRect(f.handleX, f.y + f.h / 2 - 4, 6, 8);

  // Табличка с названием над дверью
  ctx.fillStyle = COLOR_SIGN;
  ctx.fillRect(f.signX, f.signY, PREVIEW2.SIGN_W, PREVIEW2.SIGN_H);
  ctx.strokeStyle = COLOR_CORRIDOR_DOOR_DARK;
  ctx.lineWidth = 2;
  ctx.strokeRect(f.signX, f.signY, PREVIEW2.SIGN_W, PREVIEW2.SIGN_H);
  drawText(ctx, door.label, f.signX + PREVIEW2.SIGN_W / 2, f.signY + PREVIEW2.SIGN_H / 2, {
    size: PREVIEW2.SIGN_FONT,
    color: COLOR_SIGN_TEXT
  });
}

// Пол слегка темнеет к дальнему концу (верх экрана) — hint «уходя вдаль»
function drawFloorDepth(ctx) {
  const d = PREVIEW2.FLOOR_DEEP;
  const w = PREVIEW2.WALL_RIGHT_X - PREVIEW2.WALL_LEFT_W;
  ctx.fillStyle = `rgba(0, 0, 0, ${d.topAlpha})`;
  ctx.fillRect(PREVIEW2.WALL_LEFT_W, 0, w, d.topH);
  ctx.fillStyle = `rgba(0, 0, 0, ${d.midAlpha})`;
  ctx.fillRect(PREVIEW2.WALL_LEFT_W, d.topH, w, d.midH);
}

function drawBackground(ctx) {
  // Стены слева и справа, пол по центру
  ctx.fillStyle = COLOR_CORRIDOR_WALL;
  ctx.fillRect(0, 0, PREVIEW2.WALL_LEFT_W, WORLD_H);
  ctx.fillRect(PREVIEW2.WALL_RIGHT_X, 0, WORLD_W - PREVIEW2.WALL_RIGHT_X, WORLD_H);
  ctx.fillStyle = COLOR_CORRIDOR_FLOOR;
  ctx.fillRect(PREVIEW2.WALL_LEFT_W, 0, PREVIEW2.WALL_RIGHT_X - PREVIEW2.WALL_LEFT_W, WORLD_H);
  drawFloorDepth(ctx);

  // Плинтус вдоль внутреннего края обеих стен
  ctx.fillStyle = COLOR_BASEBOARD;
  ctx.fillRect(PREVIEW2.WALL_LEFT_W - 6, 0, 6, WORLD_H);
  ctx.fillRect(PREVIEW2.WALL_RIGHT_X, 0, 6, WORLD_H);

  const highlight = cutscene.state.doorHighlight;
  for (const door of PREVIEW2.DOORS) {
    const hl = highlight && highlight.doorId === door.id ? highlight : null;
    drawDoor(ctx, door, hl);
  }
}

export const preview2Scene = {
  init() {
    leaving = false;
    heroes = createHeroes(PREVIEW2.START.dasha, PREVIEW2.START.sasha);
    cutscene = createCutscene([
      { type: 'wait', time: PREVIEW2.INTRO_WAIT },
      { type: 'popup', text: TEXTS.PREVIEW2_POPUP, time: PREVIEW2.POPUP_TIME },
      // Курсор кликает по «Английскому» — первый игрок
      { type: 'show_cursor', pos: PREVIEW2.CURSOR_START },
      { type: 'move_cursor', to: PREVIEW2.ENGLISH_CLICK, dur: PREVIEW2.CURSOR_MOVE_TIME },
      { type: 'click_cursor', time: PREVIEW2.CURSOR_CLICK_TIME },
      { type: 'highlight_door', doorId: 'english', color: COLORS.HIGHLIGHT_GREEN, time: PREVIEW2.HIGHLIGHT_TIME },
      { type: 'wait', time: PREVIEW2.CURSOR_PAUSE },
      // Второй клик по той же двери — второй игрок подтвердил выбор
      { type: 'move_cursor', to: PREVIEW2.ENGLISH_CLICK_2, dur: PREVIEW2.CURSOR_RECLICK_TIME },
      { type: 'click_cursor', time: PREVIEW2.CURSOR_CLICK_TIME },
      { type: 'highlight_door', doorId: 'english', color: COLORS.HIGHLIGHT_GREEN, time: PREVIEW2.HIGHLIGHT_TIME },
      { type: 'popup', text: TEXTS.PREVIEW2_SUCCESS, time: PREVIEW2.SUCCESS_POPUP_TIME },
      { type: 'hide_cursor' },
      { type: 'call', fn: goNext }
    ], heroes);
  },

  update(dt) {
    cutscene.update(dt);
  },

  render(ctx) {
    drawBackground(ctx);
    drawCharacter(ctx, heroes.dasha);
    drawCharacter(ctx, heroes.sasha);
    cutscene.render(ctx);
  },

  // Отладка из консоли/тестов
  get debug() {
    return { heroes, leaving, state: cutscene.state };
  }
};
