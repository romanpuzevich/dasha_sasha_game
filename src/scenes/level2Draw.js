// Отрисовка Уровня 2 — «Больная Ксюша»: общажная комната сверху,
// Ксюша на кровати, таблетки, шкала здоровья, подсказки внизу и галочка победы.
// Все координаты — LEVEL2, цвета — COLORS (constants.js).
import { WORLD_W, WORLD_H, LEVEL2, TEXTS, COLORS, COLOR_OUTLINE } from '../game/constants.js';
import { drawFace, drawText } from '../engine/render.js';
import { faceImages } from '../game/players.js';

function fillRect(ctx, r, color) {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function strokeRect(ctx, r, color, lineWidth = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
}

// Кровать: каркас, простыня, подушка в изголовье и серый плед справа
function drawBed(ctx, bed, pillowColor) {
  fillRect(ctx, bed, COLORS.BED_FRAME);
  fillRect(ctx, { x: bed.x + 6, y: bed.y + 6, w: bed.w - 12, h: bed.h - 12 }, COLORS.BED_SHEET);

  const pillow = LEVEL2.PILLOW;
  fillRect(ctx, {
    x: bed.x + pillow.dx, y: bed.y + pillow.dy, w: pillow.w, h: pillow.h
  }, pillowColor);

  fillRect(ctx, {
    x: bed.x + LEVEL2.BLANKET_X, y: bed.y + 6,
    w: bed.w - LEVEL2.BLANKET_X - 6, h: bed.h - 12
  }, COLORS.BED_BLANKET);
  fillRect(ctx, { // складка у края пледа со стороны подушки
    x: bed.x + LEVEL2.BLANKET_X, y: bed.y + 6, w: 6, h: bed.h - 12
  }, COLORS.BED_BLANKET_EDGE);
}

// Стол: тёмный край и столешница
function drawTable(ctx, table) {
  fillRect(ctx, table, COLORS.TABLE_EDGE);
  fillRect(ctx, {
    x: table.x + 4, y: table.y + 4, w: table.w - 8, h: table.h - 8
  }, COLORS.TABLE_TOP);
}

// Комната: пол, стены, окна, дверь, вся мебель и вещицы (декор)
export function drawRoom(ctx) {
  fillRect(ctx, { x: 0, y: 0, w: WORLD_W, h: WORLD_H }, COLORS.ROOM_FLOOR);

  const wall = LEVEL2.WALL;
  fillRect(ctx, { x: 0, y: 0, w: WORLD_W, h: wall }, COLORS.ROOM_WALL);                    // верх
  fillRect(ctx, { x: 0, y: WORLD_H - wall, w: WORLD_W, h: wall }, COLORS.ROOM_WALL);       // низ
  fillRect(ctx, { x: 0, y: 0, w: wall, h: WORLD_H }, COLORS.ROOM_WALL);                    // лево
  fillRect(ctx, { x: WORLD_W - wall, y: 0, w: wall, h: WORLD_H }, COLORS.ROOM_WALL);       // право

  // Панорамные окна в верхней стене
  for (const win of LEVEL2.WINDOWS) {
    fillRect(ctx, win, COLORS.WINDOW_PANE);
    strokeRect(ctx, win, COLORS.WINDOW_FRAME);
  }

  // Входная дверь в нижней стене: рама, полотно, ручка
  const door = LEVEL2.DOOR;
  fillRect(ctx, door, COLORS.DOOR_ROOM_DARK);
  fillRect(ctx, { x: door.x + 8, y: door.y + 4, w: door.w - 16, h: door.h - 8 }, COLORS.DOOR_ROOM);
  fillRect(ctx, { x: door.x + door.w - 30, y: door.y + door.h / 2 - 3, w: 12, h: 6 }, COLORS.DOOR_ROOM_DARK);

  // Кровати: верхняя с Ксюшей, нижняя пустая
  drawBed(ctx, LEVEL2.BEDS.top, COLORS.PILLOW_BLUE);
  drawBed(ctx, LEVEL2.BEDS.bottom, COLORS.PILLOW_PINK);

  // Разбросанные вещи на кровати Ксюши
  for (const item of LEVEL2.BED_ITEMS) fillRect(ctx, item, item.color);

  // Тумбочка: ящик и ручка
  const ns = LEVEL2.NIGHTSTAND;
  fillRect(ctx, ns, COLORS.NIGHTSTAND);
  strokeRect(ctx, { x: ns.x + 8, y: ns.y + 8, w: ns.w - 16, h: ns.h - 16 }, COLORS.NIGHTSTAND_DARK);
  fillRect(ctx, { x: ns.x + ns.w / 2 - 9, y: ns.y + ns.h / 2 - 3, w: 18, h: 6 }, COLORS.NIGHTSTAND_DARK);

  // Стол в правом верхнем углу — завален вещами
  drawTable(ctx, LEVEL2.DESK);
  for (const item of LEVEL2.DESK_ITEMS) fillRect(ctx, item, item.color);

  // Шкафы у правой стены: у каждого две дверцы друг над другом и ручки
  for (const cl of LEVEL2.CLOSETS) {
    fillRect(ctx, cl, COLORS.CLOSET);
    strokeRect(ctx, { x: cl.x + 8, y: cl.y + 8, w: cl.w - 16, h: cl.h / 2 - 12 }, COLORS.CLOSET_DARK);
    strokeRect(ctx, { x: cl.x + 8, y: cl.y + cl.h / 2 + 4, w: cl.w - 16, h: cl.h / 2 - 12 }, COLORS.CLOSET_DARK);
    fillRect(ctx, { x: cl.x + cl.w / 2 - 2, y: cl.y + cl.h / 2 - 10, w: 4, h: 8 }, COLORS.CLOSET_DARK);
    fillRect(ctx, { x: cl.x + cl.w / 2 - 2, y: cl.y + cl.h / 2 + 2, w: 4, h: 8 }, COLORS.CLOSET_DARK);
  }

  // Стол с настольной лампой — справа от нижней кровати
  drawTable(ctx, LEVEL2.DESK_LAMP);
  const lamp = LEVEL2.LAMP;
  fillRect(ctx, { x: lamp.x - 14, y: lamp.y + 12, w: 28, h: 6 }, COLORS.LAMP_STAND); // основание
  fillRect(ctx, { x: lamp.x - 3, y: lamp.y + 1, w: 6, h: 13 }, COLORS.LAMP_STAND);  // стойка
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.LAMP_SHADE;
  ctx.fill();

  // Тетрадь по центру стола с лампой
  const nb = LEVEL2.DESK_LAMP_NOTEBOOK;
  fillRect(ctx, nb, COLORS.NOTEBOOK_YELLOW);
  strokeRect(ctx, nb, COLORS.NOTEBOOK_EDGE, 2);
}

// Ксюша на верхней кровати: круг с фото (больная → вылеченная); если файла
// нет — серый круг, а «вылеченная» без фото получает улыбающийся смайл.
// Лицо рисуется ПОСЛЕДНИМ — поверх кровати, подушки и пледа, без перекрытий.
export function drawKsyusha(ctx, well) {
  const k = LEVEL2.KSYUSHA;
  const img = well ? faceImages.ksyushaWellImg : faceImages.ksyushaBoleetImg;
  drawFace(ctx, img, k.x, k.y, k.r, COLORS.KSYUSHA_FALLBACK);

  if (well && !img) { // фолбэк «выздоровела»: глаза-точки и дуга-улыбка
    ctx.fillStyle = COLOR_OUTLINE;
    ctx.fillRect(k.x - 10, k.y - 9, 6, 6);
    ctx.fillRect(k.x + 4, k.y - 9, 6, 6);
    ctx.strokeStyle = COLOR_OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(k.x, k.y + 4, 12, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
}

// Зелёная галочка рядом с Ксюшей (появляется при победе)
export function drawWinCheck(ctx) {
  const c = LEVEL2.WIN_CHECK;
  ctx.strokeStyle = COLORS.WIN_CHECK;
  ctx.lineWidth = c.lineWidth;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x + c.size * 0.45, c.y + c.size * 0.5);
  ctx.lineTo(c.x + c.size * 1.25, c.y - c.size * 0.75);
  ctx.stroke();
}

// Таблетки: тёмная обводка, цветная заливка и блик сверху.
// Последние BLINK_TIME секунд жизни таблетка мигает: в «скрытых» фазах
// (каждые BLINK_HALF секунд) она не рисуется — предупреждение игроку.
export function drawPills(ctx, pills) {
  const p = LEVEL2.PILL;
  for (const pill of pills) {
    const life = pill.life ?? p.LIFETIME;
    const blinkPhase = Math.floor((p.BLINK_TIME - life) / p.BLINK_HALF);
    if (life < p.BLINK_TIME && blinkPhase % 2 === 1) continue;

    const color = pill.color === 'red' ? COLORS.PILL_RED : COLORS.PILL_BLUE;
    fillRect(ctx, { x: pill.x - 2, y: pill.y - 2, w: p.w + 4, h: p.h + 4 }, COLORS.PILL_EDGE);
    fillRect(ctx, { x: pill.x, y: pill.y, w: p.w, h: p.h }, color);
    fillRect(ctx, { x: pill.x + 3, y: pill.y + 3, w: p.w - 6, h: 3 }, COLORS.PILL_SHINE);
  }
}

// hex '#rrggbb' → [r, g, b]
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Цвет шкалы здоровья: красный (1 %) → жёлтый (HEALTH_MID) → зелёный (100 %)
export function healthColor(t) {
  const mid = LEVEL2.HEALTH_MID;
  const [a, b] = t <= mid
    ? [COLORS.HEALTH_RED, COLORS.HEALTH_YELLOW]
    : [COLORS.HEALTH_YELLOW, COLORS.HEALTH_GREEN];
  const k = t <= mid ? t / mid : (t - mid) / (1 - mid);
  const ca = hexRgb(a);
  const cb = hexRgb(b);
  return `rgb(${Math.round(ca[0] + (cb[0] - ca[0]) * k)}, ` +
    `${Math.round(ca[1] + (cb[1] - ca[1]) * k)}, ${Math.round(ca[2] + (cb[2] - ca[2]) * k)})`;
}

// Шкала здоровья Ксюши: подпись «Здоровье Ксюши» над полосой, тёмная рамка
// и заливка от левого края цветом-градиентом красный → жёлтый → зелёный.
export function drawHealthBar(ctx, health) {
  const bar = LEVEL2.HEALTH_BAR;
  const value = Math.max(0, Math.min(1, health));
  fillRect(ctx, bar, COLORS.ROOM_WALL_EDGE);

  ctx.fillStyle = healthColor(value);
  ctx.fillRect(
    bar.x + bar.BORDER, bar.y + bar.BORDER,
    (bar.w - bar.BORDER * 2) * value,
    bar.h - bar.BORDER * 2
  );

  // Подпись над шкалой на полупрозрачной тёмной плашке
  ctx.font = `bold ${bar.LABEL_FONT}px sans-serif`;
  const labelW = ctx.measureText(TEXTS.LEVEL2_HEALTH_LABEL).width + 16;
  const labelH = bar.LABEL_FONT + 8;
  ctx.fillStyle = COLORS.HEALTH_LABEL_BG;
  ctx.fillRect(bar.x + bar.w / 2 - labelW / 2, bar.LABEL_Y - labelH / 2, labelW, labelH);
  drawText(ctx, TEXTS.LEVEL2_HEALTH_LABEL, bar.x + bar.w / 2, bar.LABEL_Y, {
    size: bar.LABEL_FONT, color: '#ffffff'
  });
}

// Подсказки внизу экрана: полупрозрачная плашка, две строки по цветам таблеток
export function drawHints(ctx) {
  const h = LEVEL2.HINTS;
  ctx.fillStyle = COLORS.HINT_BG;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  strokeRect(ctx, h, COLORS.HINT_BORDER, 1);

  drawText(ctx, TEXTS.LEVEL2_HINT_DASHA, h.x + h.w / 2, h.y + h.PAD + h.LINE_H * 0.5, {
    size: h.FONT, color: '#ffffff'
  });
  drawText(ctx, TEXTS.LEVEL2_HINT_SASHA, h.x + h.w / 2, h.y + h.PAD + h.LINE_H * 1.5, {
    size: h.FONT, color: '#ffffff'
  });
}
