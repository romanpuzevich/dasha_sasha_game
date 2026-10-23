// Отладочное меню: значок в левом верхнем углу + панель переходов по сценам.
// Видно на всех сценах поверх игры. Координаты/цвета/тексты/клавиши —
// в DEBUG_MENU (constants.js). Мышь приходит в мировых координатах:
// main.js конвертирует её через screenToWorld (учёт letterbox и масштаба).
// До init() не рисует и не реагирует — сцены могут смело спрашивать isOpen().
import { DEBUG_MENU } from '../game/constants.js';
import { drawText } from './render.js';

let opts = null;     // { getScene(): имя сцены, goTo(имя, startAt) } — из init()
let open = false;    // панель раскрыта
let fade = 0;        // 0..1 — плавное раскрытие панели (alpha)
let iconHover = false;
let hoverIndex = -1; // наведённая кнопка (-1 — никакая)

function iconRect() {
  const icon = DEBUG_MENU.ICON;
  return { x: icon.x, y: icon.y, w: icon.size, h: icon.size };
}

function panelRect() {
  const panel = DEBUG_MENU.PANEL;
  const items = DEBUG_MENU.ITEMS.length;
  const h = panel.pad * 2 + items * panel.itemH + (items - 1) * panel.itemGap;
  return { x: DEBUG_MENU.ICON.x, y: DEBUG_MENU.ICON.y + DEBUG_MENU.ICON.size + panel.gap, w: panel.w, h };
}

function itemRect(index) {
  const panel = DEBUG_MENU.PANEL;
  const rect = panelRect();
  return {
    x: rect.x + panel.pad,
    y: rect.y + panel.pad + index * (panel.itemH + panel.itemGap),
    w: rect.w - panel.pad * 2,
    h: panel.itemH
  };
}

function inside(rect, point) {
  return point.x >= rect.x && point.x <= rect.x + rect.w &&
    point.y >= rect.y && point.y <= rect.y + rect.h;
}

export const debugMenu = {
  // Передаются колбэки: getScene() — имя текущей сцены, goTo(имя, startAt)
  init(callbacks) {
    opts = callbacks;
    open = false;
    fade = 0;
    iconHover = false;
    hoverIndex = -1;
  },

  isOpen() {
    return open;
  },

  update(dt) {
    if (!opts) return;
    const target = open ? 1 : 0;
    const step = dt / DEBUG_MENU.FADE_TIME;
    fade = target > fade ? Math.min(target, fade + step) : Math.max(target, fade - step);
  },

  render(ctx) {
    if (!opts) return;

    // Значок: полупрозрачный квадрат с «гамбургером» из трёх полосок
    const m = DEBUG_MENU;
    const icon = iconRect();
    ctx.fillStyle = iconHover ? m.ICON_BG_HOVER : m.ICON_BG;
    ctx.fillRect(icon.x, icon.y, icon.w, icon.h);
    ctx.strokeStyle = m.ICON_EDGE;
    ctx.lineWidth = 2;
    ctx.strokeRect(icon.x, icon.y, icon.w, icon.h);

    const cx = icon.x + icon.w / 2;
    const cy = icon.y + icon.h / 2;
    const linesH = m.ICON_LINE_H * 3 + m.ICON_LINE_GAP * 2;
    ctx.fillStyle = m.ICON_LINE;
    for (let i = 0; i < 3; i++) {
      const y = cy - linesH / 2 + i * (m.ICON_LINE_H + m.ICON_LINE_GAP);
      ctx.fillRect(cx - m.ICON_LINE_W / 2, y, m.ICON_LINE_W, m.ICON_LINE_H);
    }

    if (fade <= 0) return; // панель закрыта (или ещё не проявилась)

    const panel = panelRect();
    ctx.globalAlpha = fade;
    ctx.fillStyle = m.PANEL_BG;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = m.PANEL_EDGE;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    const current = opts.getScene();
    m.ITEMS.forEach((item, index) => {
      const rect = itemRect(index);
      // Кнопка текущей сцены — зелёная; под ней — hover; иначе обычная.
      // «Финал Уровня 1» (startAt) не подсвечиваем как текущую сцену
      const isCurrent = item.scene === current && !item.startAt;
      ctx.fillStyle = isCurrent ? m.ITEM_BG_CURRENT
        : index === hoverIndex ? m.ITEM_BG_HOVER
          : m.ITEM_BG;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      drawText(ctx, item.label, rect.x + m.LABEL_PAD_X, rect.y + rect.h / 2, {
        size: m.PANEL.font,
        color: m.ITEM_TEXT,
        align: 'left'
      });
    });
    ctx.globalAlpha = 1;
  },

  onMouseMove(point) {
    if (!opts) return;
    iconHover = inside(iconRect(), point);
    hoverIndex = -1;
    if (!open) return;
    DEBUG_MENU.ITEMS.forEach((item, index) => {
      if (inside(itemRect(index), point)) hoverIndex = index;
    });
  },

  onMouseDown(point) {
    if (!opts) return;

    if (inside(iconRect(), point)) { // клик по значку — открыть/закрыть
      open = !open;
      hoverIndex = -1;
      return;
    }
    if (!open) return;

    for (let index = 0; index < DEBUG_MENU.ITEMS.length; index++) {
      if (!inside(itemRect(index), point)) continue;
      const item = DEBUG_MENU.ITEMS[index];
      open = false; // клик по кнопке закрывает меню
      hoverIndex = -1;
      opts.goTo(item.scene, item.startAt);
      return;
    }
  },

  onKey(code) {
    if (!opts) return;
    if (code === DEBUG_MENU.TOGGLE_KEY) {
      open = !open;
      hoverIndex = -1;
    } else if (code === DEBUG_MENU.CLOSE_KEY) {
      open = false;
    }
  }
};
