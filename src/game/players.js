// Состояние героев: позиция, направление взгляда, цвет, фото-лицо.
import { COLOR_DASHA, COLOR_SASHA, EXTRAS } from './constants.js';

// Лица из assets/faces/*.png; заполняет main.js после асинхронной загрузки.
// null — файл ещё не загружен или отсутствует (фолбэк — цветной круг).
// ksyushaBoleetImg / ksyushaWellImg — Ксюша на Уровне 2 (больная/вылеченная).
export const faceImages = {
  dashaFaceImg: null,
  sashaFaceImg: null,
  ksyushaBoleetImg: null,
  ksyushaWellImg: null
};
for (const def of EXTRAS) faceImages[def.id] = null;

export function createCharacter(position, color, faceImgKey) {
  return {
    x: position.x,
    y: position.y,
    color,
    alpha: 1,             // для растворения «в дверях»
    dir: { x: 0, y: -1 }, // по умолчанию смотрит вверх
    // Геттер: лицо может догрузиться уже после создания героя
    get faceImg() {
      return faceImages[faceImgKey];
    }
  };
}

export function createHeroes(dashaPos, sashaPos) {
  return {
    dasha: { id: 'dasha', ...createCharacter(dashaPos, COLOR_DASHA, 'dashaFaceImg') },
    sasha: { id: 'sasha', ...createCharacter(sashaPos, COLOR_SASHA, 'sashaFaceImg') }
  };
}

// Фоновые персонажи: меньше героев, умеют плавно исчезать (alpha);
// speedMultiplier — своя скорость у каждого, journey — маршрут к точке финиша
export function createExtras(startPositions) {
  return EXTRAS.map((def) => ({
    id: def.id,
    side: def.side,
    speedMultiplier: def.speedMultiplier,
    journey: null,
    x: startPositions[def.id].x,
    y: startPositions[def.id].y,
    color: def.color,
    alpha: 1,
    target: null,
    get faceImg() {
      return faceImages[def.id];
    }
  }));
}
