// Элементы интерфейса: плашки реплик и подсказок.
import {
  WORLD_W, WORLD_H, UI, LEVEL_TITLE_FX,
  COLOR_TEXT, COLOR_DASHA, COLOR_SASHA
} from '../game/constants.js';
import { drawText } from './render.js';

function drawPanel(ctx, x, y, width, height) {
  ctx.fillStyle = UI.PANEL_COLOR;
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = UI.PANEL_BORDER;
  ctx.lineWidth = UI.PANEL_LINE_WIDTH;
  ctx.strokeRect(x, y, width, height);
}

// Простая разбивка по словам под заданную ширину
function wrapText(ctx, text, maxWidth, size) {
  ctx.font = `bold ${size}px sans-serif`;

  const lines = [];
  let line = '';

  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

// Цвет реплики по имени говорящего в начале строки
function dialogueColor(text) {
  if (text.startsWith('Даша:')) return COLOR_DASHA;
  if (text.startsWith('Саша:')) return COLOR_SASHA;
  return COLOR_TEXT;
}

// Реплика внизу экрана: тёмная плашка с рамкой (1–3 строки)
export function drawDialogue(ctx, text) {
  const width = WORLD_W - UI.DIALOGUE_MARGIN_X * 2;
  const maxTextWidth = width - UI.DIALOGUE_PADDING_X * 2;
  const lines = wrapText(ctx, text, maxTextWidth, UI.DIALOGUE_FONT);
  const height = lines.length * UI.DIALOGUE_LINE_HEIGHT + UI.DIALOGUE_PADDING_Y * 2;
  const x = UI.DIALOGUE_MARGIN_X;
  const y = WORLD_H - UI.DIALOGUE_BOTTOM - height;

  drawPanel(ctx, x, y, width, height);

  const color = dialogueColor(text);
  lines.forEach((line, index) => {
    drawText(ctx, line, x + UI.DIALOGUE_PADDING_X, y + UI.DIALOGUE_PADDING_Y + UI.DIALOGUE_LINE_HEIGHT * (index + 0.5), {
      size: UI.DIALOGUE_FONT,
      align: 'left',
      color
    });
  });
}

// Плашка-подсказка по центру (высота подстраивается под текст)
export function drawPopup(ctx, text, centerY = UI.POPUP_Y) {
  ctx.font = `bold ${UI.POPUP_FONT}px sans-serif`;
  const width = ctx.measureText(text).width + UI.POPUP_PADDING_X * 2;
  const height = UI.POPUP_FONT + UI.POPUP_PADDING_Y * 2;
  const x = (WORLD_W - width) / 2;

  drawPanel(ctx, x, centerY - height / 2, width, height);
  drawText(ctx, text, WORLD_W / 2, centerY, {
    size: UI.POPUP_FONT,
    color: COLOR_TEXT
  });
}

// Крупная плашка по центру экрана (победа, заглушки уровней)
export function drawCenterText(ctx, text) {
  ctx.font = `bold ${UI.CENTER_FONT}px sans-serif`;
  const width = ctx.measureText(text).width + UI.CENTER_PADDING_X * 2;
  const height = UI.CENTER_FONT + UI.CENTER_PADDING_Y * 2;
  const x = (WORLD_W - width) / 2;
  const y = (WORLD_H - height) / 2;

  drawPanel(ctx, x, y, width, height);
  drawText(ctx, text, WORLD_W / 2, WORLD_H / 2, {
    size: UI.CENTER_FONT,
    color: COLOR_TEXT
  });
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

// Название уровня при старте сцены: проявление → удержание → исчезновение
// (эффект начала уровня). elapsed — время сцены с init(), с; после эффекта
// функция ничего не рисует.
export function drawLevelTitle(ctx, text, elapsed) {
  const fx = LEVEL_TITLE_FX;
  const total = fx.FADE_IN + fx.HOLD + fx.FADE_OUT;
  if (elapsed >= total) return;

  let alpha = 1;
  if (elapsed < fx.FADE_IN) {
    alpha = elapsed / fx.FADE_IN;
  } else if (elapsed > fx.FADE_IN + fx.HOLD) {
    alpha = 1 - (elapsed - fx.FADE_IN - fx.HOLD) / fx.FADE_OUT;
  }

  ctx.globalAlpha = Math.max(0, alpha);
  ctx.font = `bold ${fx.FONT}px sans-serif`;
  const width = ctx.measureText(text).width + fx.PAD_X * 2;
  const height = fx.FONT + fx.PAD_Y * 2;
  const x = (WORLD_W - width) / 2;
  const y = fx.Y - height / 2;

  drawPanel(ctx, x, y, width, height);
  drawText(ctx, text, WORLD_W / 2, fx.Y, { size: fx.FONT, color: COLOR_TEXT });
  ctx.globalAlpha = 1;
}

// Многострочная плашка-подсказка по центру (длинный текст переносится
// по словам и центрируется; 2–3 строки)
export function drawPopupWrapped(ctx, text, centerY = UI.POPUP_Y) {
  const width = WORLD_W - UI.DIALOGUE_MARGIN_X * 2;
  const maxTextWidth = width - UI.POPUP_PADDING_X * 2;
  const lines = wrapText(ctx, text, maxTextWidth, UI.POPUP_FONT);
  const lineHeight = UI.POPUP_FONT * 1.25;
  const height = lines.length * lineHeight + UI.POPUP_PADDING_Y * 2;
  const x = (WORLD_W - width) / 2;
  const y = centerY - height / 2;

  drawPanel(ctx, x, y, width, height);
  lines.forEach((line, index) => {
    drawText(ctx, line, WORLD_W / 2, y + UI.POPUP_PADDING_Y + lineHeight * (index + 0.5), {
      size: UI.POPUP_FONT,
      color: COLOR_TEXT
    });
  });
}

// Шкалы Уровня 1 (HUD, виден всегда): слева растёт шкала Саши вправо,
// справа — шкала Даши влево; на 100 % обе смыкаются в центре экрана.
// Параметры — { value: 0..1, color, label }; имя рисуется в тёмной зоне
// у внешнего края, которую заливка не задевает.
export function drawScales(ctx, left, right) {
  const s = UI.SCALES;
  const barW = s.W;
  const leftX = s.MARGIN;
  const rightX = WORLD_W - s.MARGIN - barW;

  drawPanel(ctx, leftX, s.Y, barW, s.H);
  drawPanel(ctx, rightX, s.Y, barW, s.H);

  const inner = s.H - s.BORDER * 2;
  const fillMax = barW - s.BORDER * 2 - s.LABEL_W;

  ctx.fillStyle = left.color;
  ctx.fillRect(leftX + s.BORDER + s.LABEL_W, s.Y + s.BORDER, fillMax * clamp01(left.value), inner);

  ctx.fillStyle = right.color;
  const rightFillW = fillMax * clamp01(right.value);
  ctx.fillRect(rightX + barW - s.BORDER - s.LABEL_W - rightFillW, s.Y + s.BORDER, rightFillW, inner);

  drawText(ctx, left.label, leftX + s.BORDER + s.LABEL_W / 2, s.Y + s.H / 2, {
    size: s.LABEL_FONT,
    color: COLOR_TEXT
  });
  drawText(ctx, right.label, rightX + barW - s.BORDER - s.LABEL_W / 2, s.Y + s.H / 2, {
    size: s.LABEL_FONT,
    color: COLOR_TEXT
  });
}
