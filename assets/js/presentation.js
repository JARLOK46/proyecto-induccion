const progressBar = document.querySelector('[data-progress-bar]');
const currentLabel = document.querySelector('[data-current-label]');
const railCurrentLabel = document.querySelector('[data-rail-current-label]');
const railCurrentCopy = document.querySelector('[data-rail-current-copy]');
const currentDayProgress = document.querySelector('[data-current-day-progress]');
const currentPageProgress = document.querySelector('[data-current-page-progress]');
const pageStepper = document.querySelector('[data-page-stepper]');
const previousButton = document.querySelector('[data-action="previous"]');
const nextButton = document.querySelector('[data-action="next"]');

let days = [];
let deckPages = [];
let state = { dayIndex: 0, pageIndex: 0 };
let interactionsBound = false;

function clampState(dayIndex, pageIndex) {
  const safeDayIndex = Math.max(0, Math.min(dayIndex, days.length - 1));
  const dayPages = days[safeDayIndex]?.pages || [];
  const safePageIndex = Math.max(0, Math.min(pageIndex, Math.max(dayPages.length - 1, 0)));
  return { dayIndex: safeDayIndex, pageIndex: safePageIndex };
}

function getFlatIndex(dayIndex, pageIndex) {
  return days.slice(0, dayIndex).reduce((total, day) => total + day.pages.length, 0) + pageIndex;
}

function renderPageStepper(dayIndex, pageIndex) {
  if (!pageStepper) return;
  const day = days[dayIndex];
  if (!day) {
    pageStepper.innerHTML = '';
    return;
  }

  pageStepper.innerHTML = day.pages
    .map(
      (page, index) => `
        <button
          class="page-stepper__button ${index === pageIndex ? 'is-active' : ''}"
          type="button"
          data-page-jump="${index}"
          aria-current="${index === pageIndex ? 'true' : 'false'}"
          aria-label="Ir a la página ${index + 1}: ${page.title}"
          title="${page.title}"
        >
          <span class="page-stepper__index">${String(index + 1).padStart(2, '0')}</span>
        </button>
      `,
    )
    .join('');
}

function revealActiveControl(selector) {
  const activeControl = document.querySelector(selector);
  activeControl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function updateRail(dayIndex, pageIndex) {
  const day = days[dayIndex];
  const page = day?.pages?.[pageIndex];
  if (!day || !page) return;

  if (currentLabel) currentLabel.textContent = page.title;
  if (railCurrentLabel) railCurrentLabel.textContent = day.label;
  if (railCurrentCopy) railCurrentCopy.textContent = page.summary || day.shortSummary;
  if (currentDayProgress) currentDayProgress.textContent = `${dayIndex + 1}/${days.length}`;
  if (currentPageProgress) currentPageProgress.textContent = `${pageIndex + 1}/${day.pages.length}`;

  const totalDeckPages = deckPages.length;
  const flatIndex = getFlatIndex(dayIndex, pageIndex);
  if (progressBar) {
    const progress = totalDeckPages <= 1 ? 100 : (flatIndex / (totalDeckPages - 1)) * 100;
    progressBar.style.width = `${progress}%`;
  }

  document.querySelectorAll('[data-day-link]').forEach((button) => {
    const isActive = Number(button.dataset.dayIndex) === dayIndex;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  renderPageStepper(dayIndex, pageIndex);
  revealActiveControl('[data-day-link].is-active');
  revealActiveControl('.page-stepper__button.is-active');

  if (previousButton) previousButton.disabled = flatIndex === 0;
  if (nextButton) nextButton.disabled = flatIndex === totalDeckPages - 1;
}

function setActiveDeckPosition(dayIndex, pageIndex) {
  if (!days.length || !deckPages.length) return;

  state = clampState(dayIndex, pageIndex);

  deckPages.forEach((page) => {
    const isActive = Number(page.dataset.dayIndex) === state.dayIndex && Number(page.dataset.pageIndex) === state.pageIndex;
    page.dataset.state = isActive ? 'active' : 'inactive';
    page.hidden = !isActive;
    page.setAttribute('aria-hidden', String(!isActive));
    page.inert = !isActive;
  });

  updateRail(state.dayIndex, state.pageIndex);
}

function moveSequential(direction) {
  if (!days.length) return;

  const currentDay = days[state.dayIndex];
  if (!currentDay) return;

  if (direction > 0) {
    if (state.pageIndex < currentDay.pages.length - 1) {
      setActiveDeckPosition(state.dayIndex, state.pageIndex + 1);
      return;
    }

    if (state.dayIndex < days.length - 1) {
      setActiveDeckPosition(state.dayIndex + 1, 0);
    }
    return;
  }

  if (state.pageIndex > 0) {
    setActiveDeckPosition(state.dayIndex, state.pageIndex - 1);
    return;
  }

  if (state.dayIndex > 0) {
    const previousDay = days[state.dayIndex - 1];
    setActiveDeckPosition(state.dayIndex - 1, previousDay.pages.length - 1);
  }
}

function bindGlobalActions() {
  if (interactionsBound) return;
  interactionsBound = true;

  document.addEventListener('click', (event) => {
    const dayButton = event.target.closest('[data-day-link]');
    if (dayButton) {
      event.preventDefault();
      setActiveDeckPosition(Number(dayButton.dataset.dayIndex), 0);
      return;
    }

    const pageButton = event.target.closest('[data-page-jump]');
    if (pageButton) {
      event.preventDefault();
      setActiveDeckPosition(state.dayIndex, Number(pageButton.dataset.pageJump));
    }
  });

  previousButton?.addEventListener('click', () => moveSequential(-1));
  nextButton?.addEventListener('click', () => moveSequential(1));

  document.addEventListener('keydown', (event) => {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if (isTyping) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveSequential(1);
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      moveSequential(-1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveDeckPosition(0, 0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      const lastDayIndex = days.length - 1;
      const lastPageIndex = days[lastDayIndex].pages.length - 1;
      setActiveDeckPosition(lastDayIndex, lastPageIndex);
    }
  });
}

document.addEventListener('landing:rendered', (event) => {
  days = event.detail.days || [];
  deckPages = [...document.querySelectorAll('[data-page]')];
  bindGlobalActions();
  setActiveDeckPosition(0, 0);
});
