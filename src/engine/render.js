// Хелперы отрисовки: канвас, мировые координаты, примитивы.
import { WORLD_W, WORLD_H, PLAYER_RADIUS, EXTRA_RADIUS, COLOR_OUTLINE } from '../game/constants.js';

// Геометрия лица героя (пропорции от PLAYER_RADIUS — масштабируются вместе с героем)
const EYE_OFFSET = PLAYER_RADIUS * 0.27;  // смещение глаз вперёд от центра, px
const EYE_SPREAD = PLAYER_RADIUS * 0.27;  // половина расстояния между глазами, px
const EYE_RADIUS = PLAYER_RADIUS * 0.16;  // радиус «зрачка», px
const FACE_RING_WIDTH = 2;                // толщина рамки вокруг лица, px

// Размер канваса из последнего resizeCanvas
let viewW = WORLD_W;
let viewH = WORLD_H;

// Канвас на весь viewport; пропорции мира и центрирование — в applyWorldTransform
export function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  viewW = canvas.width;
  viewH = canvas.height;
}

// Масштаб + смещение: после этого рисуем в координатах 960×640,
// свободное место по краям остаётся чёрным (letterbox)
export function applyWorldTransform(ctx) {
  const scale = Math.min(viewW / WORLD_W, viewH / WORLD_H);
  const offsetX = (viewW - WORLD_W * scale) / 2;
  const offsetY = (viewH - WORLD_H * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
}

// Обратное преобразование: пиксели канваса → мировые координаты.
// Нужно мыши (отладочное меню): та же формула, что в applyWorldTransform.
export function screenToWorld(x, y) {
  const scale = Math.min(viewW / WORLD_W, viewH / WORLD_H);
  const offsetX = (viewW - WORLD_W * scale) / 2;
  const offsetY = (viewH - WORLD_H * scale) / 2;
  return { x: (x - offsetX) / scale, y: (y - offsetY) / scale };
}

export function drawCircle(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// Загрузка картинки. При ошибке (или в headless-тестах без Image) — null,
// чтобы сработал фолбэк на цветной круг.
export function loadImage(src) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Лицо героя: картинка, обрезанная по кругу, с тонкой рамкой цвета героя.
// Если картинки нет (не загрузилась / файла нет) — заливка fallbackColor.
export function drawFace(ctx, img, x, y, radius, fallbackColor) {
  if (!img) {
    drawCircle(ctx, x, y, radius, fallbackColor);
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  // Центральный квадрат фото (cover): лицо не растягивается под круг
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();

  // Рамка цвета героя, чтобы лицо не сливалось с фоном
  ctx.beginPath();
  ctx.arc(x, y, radius - FACE_RING_WIDTH / 2, 0, Math.PI * 2);
  ctx.lineWidth = FACE_RING_WIDTH;
  ctx.strokeStyle = fallbackColor;
  ctx.stroke();
}

// Герой: тёмная обводка, внутри — лицо (или цветной круг с глазами-точками,
// пока лицо не загружено). hero = { x, y, color, dir: { x, y }, faceImg, alpha }.
// alpha (0..1) — для «входа» в здание (растворение в проёме)
export function drawCharacter(ctx, hero) {
  const alpha = hero.alpha ?? 1;
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  drawCircle(ctx, hero.x, hero.y, PLAYER_RADIUS, COLOR_OUTLINE);
  drawFace(ctx, hero.faceImg, hero.x, hero.y, PLAYER_RADIUS - 3, hero.color);

  if (!hero.faceImg) {
    const dir = hero.dir || { x: 0, y: -1 };
    const sideX = -dir.y;
    const sideY = dir.x;
    const eyeX = hero.x + dir.x * EYE_OFFSET;
    const eyeY = hero.y + dir.y * EYE_OFFSET;

    drawCircle(ctx, eyeX + sideX * EYE_SPREAD, eyeY + sideY * EYE_SPREAD, EYE_RADIUS, COLOR_OUTLINE);
    drawCircle(ctx, eyeX - sideX * EYE_SPREAD, eyeY - sideY * EYE_SPREAD, EYE_RADIUS, COLOR_OUTLINE);
  }
  ctx.restore();
}

// Фоновый персонаж: обводка и лицо меньшего радиуса; alpha — для fade out.
// Глаза-точки не рисуем — у толпы достаточно круга/фото.
export function drawExtra(ctx, extra) {
  if (extra.alpha <= 0) return;

  ctx.globalAlpha = extra.alpha;
  drawCircle(ctx, extra.x, extra.y, EXTRA_RADIUS, COLOR_OUTLINE);
  drawFace(ctx, extra.faceImg, extra.x, extra.y, EXTRA_RADIUS - 2, extra.color);
  ctx.globalAlpha = 1;
}

export function drawText(ctx, text, x, y, opts = {}) {
  const {
    size = 24,
    bold = true,
    color = '#ffffff',
    align = 'center',
    baseline = 'middle'
  } = opts;

  // Защита: если в текст случайно попал undefined/null — рисуем пустую
  // строку, а не слово «undefined» на экране (так вылезал баг с устаревшим
  // закэшированным модулем, ссылавшимся на удалённый ключ TEXTS).
  const safeText = String(text ?? '');

  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(safeText, x, y);
}
