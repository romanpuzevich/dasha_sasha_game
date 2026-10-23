// Клавиатура: слушаем window по event.code (не зависит от раскладки).
// Раскладка (см. AGENTS.md, раздел 4):
//   Даша: WASD, действия — Space или E;
//   Саша: стрелки, действия — LeftShift или Enter.
// F — фулскрин (запрос прямо из обработчика нажатия — это разрешено браузером).

// Состояние, которое читают сцены
export const inputState = {
  dasha: { up: false, down: false, left: false, right: false, action: false },
  sasha: { up: false, down: false, left: false, right: false, action: false },
  fullscreenPressed: false
};

// Физически зажатые клавиши: две клавиши действия одного игрока
// должны быть взаимозаменяемы (отпустили одну — вторая ещё держит действие)
const downCodes = new Set();

function updatePlayerState() {
  inputState.dasha.up = downCodes.has('KeyW');
  inputState.dasha.down = downCodes.has('KeyS');
  inputState.dasha.left = downCodes.has('KeyA');
  inputState.dasha.right = downCodes.has('KeyD');
  inputState.dasha.action = downCodes.has('Space') || downCodes.has('KeyE');

  inputState.sasha.up = downCodes.has('ArrowUp');
  inputState.sasha.down = downCodes.has('ArrowDown');
  inputState.sasha.left = downCodes.has('ArrowLeft');
  inputState.sasha.right = downCodes.has('ArrowRight');
  inputState.sasha.action = downCodes.has('ShiftLeft') || downCodes.has('Enter');
}

function requestFullscreen() {
  if (document.fullscreenElement) return;

  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request) return;

  try {
    const result = request.call(root);
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // Браузер не дал — молча игнорируем
  }
}

function onKeyDown(event) {
  // Стрелки и пробел не должны скроллить страницу
  if (event.code === 'Space' || event.code.startsWith('Arrow')) {
    event.preventDefault();
  }

  if (event.code === 'KeyF') {
    inputState.fullscreenPressed = true;
    if (!event.repeat) requestFullscreen();
    return;
  }

  downCodes.add(event.code);
  updatePlayerState();
}

function onKeyUp(event) {
  if (event.code === 'KeyF') {
    inputState.fullscreenPressed = false;
    return;
  }

  downCodes.delete(event.code);
  updatePlayerState();
}

function onBlur() {
  // Потеряли фокус — зажатые клавиши не должны «залипать»
  downCodes.clear();
  inputState.fullscreenPressed = false;
  updatePlayerState();
}

export function initInput() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
}
