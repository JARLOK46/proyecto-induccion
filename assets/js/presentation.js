const progressBar = document.querySelector('[data-progress-bar]');
const currentLabel = document.querySelector('[data-current-label]');
const previousButton = document.querySelector('[data-action="previous"]');
const nextButton = document.querySelector('[data-action="next"]');

let slides = [];
let activeIndex = 0;

function scrollToElement(targetId) {
  const element = document.getElementById(targetId);
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setActiveSlide(index) {
  if (!slides.length) return;
  activeIndex = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach((slide, slideIndex) => {
    slide.dataset.state = slideIndex === activeIndex ? 'active' : 'inactive';
  });

  const current = slides[activeIndex];
  const isHero = current.dataset.day === 'hero';
  const currentDay = isHero ? 'Introducción' : current.dataset.day;
  if (currentLabel) {
    currentLabel.textContent = isHero ? 'Intro' : currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
  }

  if (progressBar) {
    const progress = slides.length === 1 ? 100 : (activeIndex / (slides.length - 1)) * 100;
    progressBar.style.width = `${progress}%`;
  }

  document.querySelectorAll('[data-day-link]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.dayLink === current.dataset.day);
  });

  if (previousButton) previousButton.disabled = activeIndex === 0;
  if (nextButton) nextButton.disabled = activeIndex === slides.length - 1;
}

function bindGlobalActions() {
  document.addEventListener('click', (event) => {
    const jumpButton = event.target.closest('[data-jump-to]');
    if (jumpButton) {
      event.preventDefault();
      scrollToElement(jumpButton.dataset.jumpTo);
      return;
    }

    const sectionLink = event.target.closest('[data-target-id]');
    if (sectionLink) {
      event.preventDefault();
      scrollToElement(sectionLink.dataset.targetId);
    }
  });

  previousButton?.addEventListener('click', () => {
    if (activeIndex > 0) {
      scrollToElement(slides[activeIndex - 1].id);
    }
  });

  nextButton?.addEventListener('click', () => {
    if (activeIndex < slides.length - 1) {
      scrollToElement(slides[activeIndex + 1].id);
    }
  });

  document.addEventListener('keydown', (event) => {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if (isTyping) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      nextButton?.click();
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      previousButton?.click();
    }

    if (event.key === 'Home') {
      event.preventDefault();
      scrollToElement(slides[0]?.id);
    }

    if (event.key === 'End') {
      event.preventDefault();
      scrollToElement(slides[slides.length - 1]?.id);
    }
  });
}

function observeSlides() {
  if (!('IntersectionObserver' in window)) {
    setActiveSlide(0);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

      if (!visible) return;
      const nextIndex = slides.findIndex((slide) => slide === visible.target);
      if (nextIndex >= 0) setActiveSlide(nextIndex);
    },
    {
      threshold: [0.35, 0.6, 0.85],
    },
  );

  slides.forEach((slide) => observer.observe(slide));
}

document.addEventListener('landing:rendered', () => {
  slides = [...document.querySelectorAll('[data-slide]')];
  bindGlobalActions();
  observeSlides();
  setActiveSlide(0);
});
