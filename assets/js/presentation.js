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

function revealActiveControl(selector) {
  const activeControl = document.querySelector(selector);
  activeControl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function updateRail(dayIndex, pageIndex) {
  const day = days[dayIndex];
  const page = day?.pages?.[pageIndex];
  if (!day || !page) return;

  document.querySelectorAll('[data-day-link]').forEach((button) => {
    const isActive = Number(button.dataset.dayIndex) === dayIndex;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  revealActiveControl('[data-day-link].is-active');
  revealActiveControl('.slide[data-state="active"] .page-stepper__button.is-active');
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
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      event.preventDefault();
      moveSequential(actionButton.dataset.action === 'previous' ? -1 : 1);
    }
  });

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
