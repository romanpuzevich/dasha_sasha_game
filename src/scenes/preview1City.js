// Превью 1: отрисовка города (МФТИ, корпус микроэлектроники).
// Псевдо-3D: фасады — в верхней части, площадь — в нижней.
// Все координаты и цвета — в constants.js.
// Малые формы (скамейки, памятник, светофор, столб) — в preview1Props.js.
import { WORLD_W, WORLD_H, PREVIEW1, TEXTS, COLORS } from '../game/constants.js';
import { drawText } from '../engine/render.js';

// ==== Фасады ====

function drawFacade(ctx, rect, color) {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = COLORS.BUILDING_EDGE;
  ctx.lineWidth = PREVIEW1.BUILDING_EDGE_WIDTH;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

// Ряд окон: светлый прямоугольник в рамке
function drawWindowGrid(ctx, columns, rows, size, color) {
  const frame = PREVIEW1.WINDOWS.frameWidth;
  for (const y of rows) {
    for (const x of columns) {
      ctx.fillStyle = COLORS.WINDOW_FRAME;
      ctx.fillRect(x - frame, y - frame, size.w + frame * 2, size.h + frame * 2);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size.w, size.h);
    }
  }
}

function drawSign(ctx, sign, text) {
  ctx.fillStyle = COLORS.SIGN_BG;
  ctx.fillRect(sign.x, sign.y, sign.w, sign.h);
  ctx.strokeStyle = COLORS.SIGN_TEXT;
  ctx.lineWidth = sign.borderWidth;
  ctx.strokeRect(sign.x, sign.y, sign.w, sign.h);
  drawText(ctx, text, sign.x + sign.w / 2, sign.y + sign.h / 2, {
    size: sign.fontSize,
    color: COLORS.SIGN_TEXT
  });
}

// КПМ — отдельное здание слева, стоит боком: фасад на всю высоту фона
function drawKpmBuilding(ctx) {
  const win = PREVIEW1.KPM_WINDOWS;
  drawFacade(ctx, PREVIEW1.KPM_BUILDING, COLORS.KPM_BLUE);

  const rows = [];
  for (let i = 0; i < win.count; i++) rows.push(win.startY + i * win.stepY);
  drawWindowGrid(ctx, win.columns, rows, win.size, COLORS.WINDOW);

  drawSign(ctx, PREVIEW1.KPM_SIGN, TEXTS.KPM_SIGN);
}

// Вертикальные оранжево-коричневые полосы на синем фасаде
function drawStripes(ctx) {
  const b = PREVIEW1.MAIN_BUILDING;
  const s = PREVIEW1.STRIPES;
  const colors = [COLORS.STRIPES_ORANGE, COLORS.STRIPES_BROWN];

  let index = 0;
  for (let x = b.x + s.offsetX; x < b.x + b.w - s.width; x += s.step) {
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(x, b.y, s.width, s.height);
    index += 1;
  }
}

function drawMainBuilding(ctx) {
  const win = PREVIEW1.WINDOWS;
  drawFacade(ctx, PREVIEW1.MAIN_BUILDING, COLORS.BUILDING_BLUE);
  drawStripes(ctx);
  drawWindowGrid(ctx, win.mainLeftColumns, win.mainLeftRows, win.size, COLORS.WINDOW);
  drawWindowGrid(ctx, win.mainRightColumns, win.mainRightRows, win.size, COLORS.WINDOW);

  // Стеклянный вход с вертикальными тёмными рамами
  const e = PREVIEW1.ENTRANCE;
  const frames = PREVIEW1.ENTRANCE_FRAMES;
  ctx.fillStyle = COLORS.ENTRANCE_GLASS;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = COLORS.ENTRANCE_FRAME;
  ctx.lineWidth = e.borderWidth;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = COLORS.ENTRANCE_FRAME;
  for (let i = 0; i < frames.count; i++) {
    ctx.fillRect(e.x + frames.offsetX + i * frames.step, e.y, frames.width, e.h);
  }

  drawSign(ctx, PREVIEW1.SIGN, TEXTS.BUILDING_SIGN);

  // «МФТИ» у нижних окон справа от входа, не задевает ступени
  const mipti = PREVIEW1.MIPTI;
  drawText(ctx, TEXTS.MIPTI_SIGN, mipti.x, mipti.y, {
    size: mipti.fontSize,
    color: COLORS.MIPTI_TEXT,
    align: 'left'
  });
}

function drawRightWing(ctx) {
  const win = PREVIEW1.WINDOWS;
  drawFacade(ctx, PREVIEW1.RIGHT_WING, COLORS.RIGHT_WING_BLUE);
  drawWindowGrid(ctx, win.rightColumns, win.rightRows, win.rightSize, COLORS.WINDOW_RIGHT_WING);
}

function drawStairs(ctx) {
  const s = PREVIEW1.STAIRS;
  ctx.fillStyle = COLORS.STAIRS;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = COLORS.STAIRS_LINE;
  for (let i = 1; i <= s.lineCount; i++) {
    ctx.fillRect(s.x, s.y + (s.h * i) / (s.lineCount + 1), s.w, s.lineHeight);
  }
}

// ==== Площадь, дорога, тротуары ====

function drawTileGrid(ctx, rect) {
  const g = PREVIEW1.PLAZA_GRID;
  ctx.fillStyle = COLORS.PLAZA_GRID;
  for (let x = rect.x + g.stepX; x < rect.x + rect.w; x += g.stepX) {
    ctx.fillRect(x, rect.y, g.lineWidth, rect.h);
  }
  for (let y = rect.y + g.stepY; y < rect.y + rect.h; y += g.stepY) {
    ctx.fillRect(rect.x, y, rect.w, g.lineWidth);
  }
}

function drawPlazaAndRoad(ctx) {
  // Плитка площади
  const p = PREVIEW1.PLAZA;
  ctx.fillStyle = COLORS.PLAZA;
  ctx.fillRect(0, p.y, WORLD_W, p.h);
  drawTileGrid(ctx, { x: 0, y: p.y, w: WORLD_W, h: p.h });

  // Дорога на всю ширину мира, с бордюрами
  const r = PREVIEW1.ROAD;
  ctx.fillStyle = COLORS.ROAD;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = COLORS.ROAD_EDGE;
  ctx.fillRect(r.x, r.y, r.w, r.edgeWidth);
  ctx.fillRect(r.x, r.y + r.h - r.edgeWidth, r.w, r.edgeWidth);

  // Зебра
  const c = PREVIEW1.CROSSWALK;
  ctx.fillStyle = COLORS.CROSSWALK;
  for (let y = r.y + c.offsetY; y + c.stripeHeight <= r.y + r.h - r.edgeWidth; y += c.stripeStep) {
    ctx.fillRect(c.x, y, c.w, c.stripeHeight);
  }

  // Нижний тротуар
  const sb = PREVIEW1.SIDEWALK_BOTTOM;
  ctx.fillStyle = COLORS.SIDEWALK;
  ctx.fillRect(0, sb.y, WORLD_W, sb.h);
}

// Полный фон сцены: небо, площадь, дорога и фасады
export function drawCity(ctx) {
  ctx.fillStyle = COLORS.SKY;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  drawPlazaAndRoad(ctx);
  drawKpmBuilding(ctx);
  drawMainBuilding(ctx);
  drawRightWing(ctx);
  drawStairs(ctx);
}
