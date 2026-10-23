// Бутстрап: канвас, ввод, аудио-заглушка, менеджер сцен, запуск цикла.
import { COLOR_BG, EXTRAS, DEBUG_MENU } from './game/constants.js';
import { startLoop } from './engine/loop.js';
import { initInput } from './engine/input.js';
import { scenes } from './engine/scenes.js';
import { resizeCanvas, applyWorldTransform, screenToWorld, loadImage } from './engine/render.js';
import { initAudio } from './engine/audio.js';
import { debugMenu } from './engine/debugmenu.js';
import { faceImages } from './game/players.js';
import { titleScene } from './scenes/title.js';
import { preview1Scene } from './scenes/preview1.js';
import { preview2Scene } from './scenes/preview2.js';
import { enterPlateScene } from './scenes/enterPlate.js';
import { level1Scene } from './scenes/level1.js';
import { level2Scene } from './scenes/level2.js';
import { level3Scene } from './scenes/level3.js';

// Отладочные переходы: F2 — превью 1, F3 — превью 2, F4 — плашка, F5 — Уровень 1
const DEBUG_SCENES = {
  F2: preview1Scene,
  F3: preview2Scene,
  F4: enterPlateScene,
  F5: level1Scene
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function handleResize() {
  resizeCanvas(canvas);
}

initInput();
initAudio();

// Отладочное меню: имена сцен для кнопок; goTo — переход через менеджер
// сцен (с fade). startAt уходит в window.__debugStartLevel1At — level1
// прочитает флаг в init() и стартует сразу с нужной фазы (например, финала)
const SCENE_BY_NAME = {
  title: titleScene,
  preview1: preview1Scene,
  preview2: preview2Scene,
  enterPlate: enterPlateScene,
  level1: level1Scene,
  level2: level2Scene,
  level3: level3Scene
};

function currentSceneName() {
  const current = scenes.getCurrent();
  return Object.keys(SCENE_BY_NAME).find((name) => SCENE_BY_NAME[name] === current) || '';
}

debugMenu.init({
  getScene: currentSceneName,
  goTo(name, startAt) {
    if (startAt) window.__debugStartLevel1At = startAt;
    if (SCENE_BY_NAME[name]) scenes.setScene(SCENE_BY_NAME[name]);
  }
});

// Фото-лица подгружаем фоном, не блокируя цикл: пока не загрузились
// (или файла нет) — герой рисуется цветным кругом
const FACE_SOURCES = [
  { src: 'assets/faces/dasha.png', key: 'dashaFaceImg' },
  { src: 'assets/faces/sasha.png', key: 'sashaFaceImg' },
  { src: 'assets/faces/ksyusha_boleet.png', key: 'ksyushaBoleetImg' }, // Уровень 2
  { src: 'assets/faces/ksyusha.png', key: 'ksyushaWellImg' },          // после лечения
  ...EXTRAS.map(({ id, face }) => ({ src: `assets/faces/${face}`, key: id }))
];

// Наличие файла проверяем через fetch: <img> на отсутствующий файл пишет
// красную ошибку 404 в консоль, а fetch — нет. Файла ещё нет — молча
// пропускаем, персонаж рисуется цветным кругом (см. AGENTS.md, раздел 12).
async function faceExists(src) {
  if (typeof location === 'undefined' || !location.protocol.startsWith('http')) {
    return true; // file:// без предпроверки — грузим как раньше
  }
  try {
    const response = await fetch(src, { method: 'HEAD' });
    return response.ok;
  } catch {
    return true; // сервер не ответил на HEAD — просто попробуем загрузить
  }
}

Promise.all(FACE_SOURCES.map(async ({ src, key }) => {
  if (!(await faceExists(src))) return; // файла ещё нет — фолбэк без шума в консоли
  const img = await loadImage(src);
  if (img) {
    faceImages[key] = img;
  } else {
    console.warn(`Не загрузилось ${src} — персонаж рисуется цветным кругом`);
  }
}));

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);
handleResize();

// Мышь: координаты канваса → мировые (letterbox и масштаб учтены),
// затем в отладочное меню. Клики по игровому полю нигде больше не нужны
function mouseToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width || 1);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height || 1);
  return screenToWorld(x, y);
}

canvas.addEventListener('mousemove', (event) => debugMenu.onMouseMove(mouseToWorld(event)));
canvas.addEventListener('mousedown', (event) => debugMenu.onMouseDown(mouseToWorld(event)));
canvas.addEventListener('touchstart', (event) => {
  if (event.touches[0]) debugMenu.onMouseDown(mouseToWorld(event.touches[0]));
}, { passive: true });

// Коды клавиш — активной сцене; автоповторы не считаем отдельными нажатиями
window.addEventListener('keydown', (event) => {
  debugMenu.onKey(event.code); // `/~ — меню, Esc — закрыть панель
  if (event.code === DEBUG_MENU.TOGGLE_KEY) {
    event.preventDefault();
    return;
  }

  const debugScene = DEBUG_SCENES[event.code];
  if (debugScene) {
    event.preventDefault();
    if (scenes.getCurrent() !== debugScene) scenes.setScene(debugScene);
    return;
  }

  // Пока отладочное меню открыто, геймплейные клавиши сцене не идут
  if (!event.repeat && !debugMenu.isOpen()) scenes.handleKey(event.code);
});

scenes.setScene(titleScene);

startLoop({
  update(dt) {
    scenes.update(dt);
    debugMenu.update(dt);
  },

  render() {
    // Чёрный фон канваса даёт поля вокруг мира (letterbox)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    applyWorldTransform(ctx);
    scenes.render(ctx);
    debugMenu.render(ctx); // поверх сцены и fade-вуали — видно на всех сценах
  }
});
