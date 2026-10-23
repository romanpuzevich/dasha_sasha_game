// Вступительная катсцена Уровня 2: переписка в телефоне.
// Чёрный фон, по центру — макет смартфона; внутри экрана по одному
// появляются сообщения (слева серые пузыри Саши, справа синие — Даши).
// Геометрия и тексты — LEVEL2.CHAT (constants.js), цвета — COLORS.
import { WORLD_W, WORLD_H, LEVEL2, COLORS, COLOR_DASHA, COLOR_SASHA } from '../game/constants.js';
import { drawText, drawFace } from '../engine/render.js';
import { faceImages } from '../game/players.js';

// Прямоугольник с закруглёнными углами (без ctx.roundRect — он есть не везде)
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Перенос текста сообщения по словам под ширину пузыря
function wrap(ctx, text, maxWidth, size) {
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

// Один пузырь сообщения: слева — Саша, справа — Даша. Возвращает высоту.
function drawBubble(ctx, msg, x, y, scr) {
  const b = LEVEL2.CHAT.BUBBLE;
  const lines = wrap(ctx, msg.text, b.MAX_W, b.FONT);
  const textW = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const w = textW + b.PAD_X * 2;
  const h = lines.length * b.LINE_H + b.PAD_Y * 2;
  const fromDasha = msg.from === 'dasha';
  const bx = fromDasha ? x + scr.w - b.MARGIN - w : x + b.MARGIN;

  ctx.fillStyle = fromDasha ? COLORS.CHAT_BUBBLE_DASHA : COLORS.CHAT_BUBBLE_SASHA;
  roundRect(ctx, bx, y, w, h, b.R);
  ctx.fill();

  lines.forEach((line, i) => {
    drawText(ctx, line, bx + b.PAD_X, y + b.PAD_Y + b.LINE_H * (i + 0.5), {
      size: b.FONT, align: 'left', color: COLORS.CHAT_TEXT
    });
  });
  return h;
}

// Кадр катсцены: чёрный фон + смартфон с visibleCount сообщениями.
// alpha < 1 — плавное растворение перед переходом к комнате.
export function drawPhoneChat(ctx, visibleCount, alpha) {
  const c = LEVEL2.CHAT;
  const ph = c.PHONE;
  const scr = {
    x: ph.x + c.BORDER, y: ph.y + c.BORDER,
    w: ph.w - c.BORDER * 2, h: ph.h - c.BORDER * 2
  };

  ctx.fillStyle = COLORS.CHAT_BG;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.globalAlpha = Math.max(0, alpha);

  ctx.fillStyle = COLORS.CHAT_PHONE; // корпус
  roundRect(ctx, ph.x, ph.y, ph.w, ph.h, ph.r);
  ctx.fill();

  ctx.fillStyle = COLORS.CHAT_SCREEN; // экран чуть светлее
  roundRect(ctx, scr.x, scr.y, scr.w, scr.h, Math.max(4, ph.r - c.BORDER));
  ctx.fill();

  // Лица героев снаружи корпуса: Саша слева, Даша справа (на уровне верха
  // телефона). Пока фото не загрузились — цветные круги (красный / жёлтый)
  const f = c.FACES;
  drawFace(ctx, faceImages.sashaFaceImg, f.sasha.x, f.sasha.y, f.radius, COLOR_SASHA);
  drawFace(ctx, faceImages.dashaFaceImg, f.dasha.x, f.dasha.y, f.radius, COLOR_DASHA);

  // Сообщения сверху вниз — каждое с новой строки, по одному
  let y = scr.y + c.BUBBLE.PAD_TOP;
  for (let i = 0; i < visibleCount && i < c.MESSAGES.length; i++) {
    y += drawBubble(ctx, c.MESSAGES[i], scr.x, y, scr) + c.BUBBLE.GAP;
  }

  ctx.globalAlpha = 1;
}
