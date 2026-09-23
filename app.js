const MAX_PARTICIPANTS = 100000;
const PICK_COOLDOWN_MS = 300;

function validateCount(raw) {
  const text = String(raw).trim();

  if (text === "") {
    return { ok: false, message: "Введите количество участников." };
  }

  if (text.startsWith("-")) {
    return { ok: false, message: "Количество участников не может быть отрицательным." };
  }

  if (/^\d+[.,]\d+$/.test(text)) {
    return { ok: false, message: "Введите целое число без дробной части." };
  }

  if (!/^\d+$/.test(text)) {
    return { ok: false, message: "Допустимы только цифры. Введите положительное целое число." };
  }

  const value = Number(text);

  if (value === 0) {
    return { ok: false, message: "Количество участников должно быть больше 0." };
  }

  if (value > MAX_PARTICIPANTS) {
    return {
      ok: false,
      message: "Слишком большое значение. Максимум — 100 000 участников.",
    };
  }

  return { ok: true, value };
}

function createDraw(total) {
  const picked = new Set();

  return {
    total,
    winners: [],
    get remaining() {
      return total - picked.size;
    },
    pick() {
      if (this.remaining === 0) {
        throw new Error("Все участники уже выиграли");
      }
      let number;
      do {
        number = Math.floor(Math.random() * total) + 1;
      } while (picked.has(number));
      picked.add(number);
      this.winners.push(number);
      return number;
    },
  };
}

function init() {
  const countInput = document.getElementById("count");
  const drawBtn = document.getElementById("drawBtn");
  const resetBtn = document.getElementById("resetBtn");
  const errorEl = document.getElementById("error");
  const statusEl = document.getElementById("status");
  const winnerBox = document.getElementById("winnerBox");
  const winnerNumber = document.getElementById("winnerNumber");
  const winnersSection = document.getElementById("winnersSection");
  const winnersList = document.getElementById("winnersList");
  const winnersCount = document.getElementById("winnersCount");

  let draw = null;
  let lastPickAt = 0;

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function renderWinner(number) {
    winnerBox.hidden = false;
    winnerNumber.textContent = String(number);

    const item = document.createElement("li");
    item.textContent = String(number);
    winnersList.prepend(item);
    winnersCount.textContent = String(draw.winners.length);
  }

  function finishDrawIfNeeded() {
    if (draw.remaining > 0) {
      drawBtn.textContent = "Выбрать следующего победителя";
      drawBtn.disabled = false;
      return;
    }
    drawBtn.textContent = "Все участники уже выиграли";
    drawBtn.disabled = true;
    statusEl.textContent = "Все участники уже выиграли. Начните новый розыгрыш.";
    statusEl.classList.add("warning");
  }

  function startDraw() {
    const result = validateCount(countInput.value);
    if (!result.ok) {
      showError(result.message);
      countInput.focus();
      return;
    }

    draw = createDraw(result.value);
    clearError();
    countInput.disabled = true;
    winnersSection.hidden = false;
    resetBtn.hidden = false;
    statusEl.textContent = "Розыгрыш запущен. Поле количества участников заблокировано.";
    statusEl.classList.remove("warning");
  }

  function pickWinner() {
    const number = draw.pick();
    lastPickAt = Date.now();
    renderWinner(number);
    finishDrawIfNeeded();
  }

  function onDrawClick() {
    if (Date.now() - lastPickAt < PICK_COOLDOWN_MS) return;

    if (!draw) {
      startDraw();
      if (!draw) return;
    }

    if (draw.remaining === 0) {
      finishDrawIfNeeded();
      return;
    }

    pickWinner();
  }

  function resetDraw() {
    if (!draw) return;

    const confirmed = confirm(
      "Список победителей будет очищен и начнётся новый розыгрыш. Продолжить?"
    );
    if (!confirmed) return;

    draw = null;
    lastPickAt = 0;
    countInput.disabled = false;
    clearError();
    winnerBox.hidden = true;
    winnerNumber.textContent = "—";
    winnersList.innerHTML = "";
    winnersCount.textContent = "0";
    winnersSection.hidden = true;
    resetBtn.hidden = true;
    statusEl.textContent = "";
    statusEl.classList.remove("warning");
    drawBtn.textContent = "Выбрать победителя";
    drawBtn.disabled = false;
    countInput.focus();
  }

  drawBtn.addEventListener("click", onDrawClick);
  resetBtn.addEventListener("click", resetDraw);
  countInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onDrawClick();
    }
  });
}

if (typeof document !== "undefined") {
  init();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateCount, createDraw, MAX_PARTICIPANTS };
}
