const DAY_ORDER = [
  { slug: 'lunes', label: 'Lunes', accent: 'available' },
  { slug: 'martes', label: 'Martes', accent: 'available' },
  { slug: 'miercoles', label: 'Miércoles', accent: 'institutional' },
  { slug: 'jueves', label: 'Jueves', accent: 'pending' },
  { slug: 'viernes', label: 'Viernes', accent: 'presentation' },
];

const BASE_SECTION_ORDER = [
  'Resumen',
  'Agenda',
  'Temas',
  'Responsables',
  'Desarrollo de la jornada',
  'Bloque institucional SENA',
  'Bloque de exposición',
  'Otros temas mencionados en la jornada',
  'Derechos, deberes y faltas del aprendiz',
  'Pendientes de ampliación o confirmación',
  'Pendientes de verificación',
  'Recordatorios',
  'Fuentes institucionales verificadas',
  'Assets pendientes',
];

const DAY_NOTES = {
  jueves: 'Día todavía sin archivo desarrollado. La landing preserva el espacio para completarlo sin inventar contenido.',
  viernes: 'El cierre semanal reserva el bloque de exposición aunque la fuente Markdown siga vacía.',
};

const slidesTrack = document.querySelector('[data-slides-track]');
const dayNav = document.querySelector('[data-day-nav]');
const loadingState = document.querySelector('[data-loading]');

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function renderInline(text = '') {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderMarkdown(markdown = '') {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return '<p>Contenido pendiente.</p>';
  }

  const lines = normalized.split('\n');
  const html = [];
  let paragraph = [];
  let listItems = [];
  let quoteLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    html.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  const flushQuote = () => {
    if (!quoteLines.length) return;
    html.push(`<blockquote>${quoteLines.map((line) => `<p>${renderInline(line)}</p>`).join('')}</blockquote>`);
    quoteLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      return;
    }

    if (/^####\s+/.test(trimmed)) {
      flushAll();
      html.push(`<h5>${renderInline(trimmed.replace(/^####\s+/, ''))}</h5>`);
      return;
    }

    if (/^###\s+/.test(trimmed)) {
      flushAll();
      html.push(`<h4>${renderInline(trimmed.replace(/^###\s+/, ''))}</h4>`);
      return;
    }

    if (/^>\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      quoteLines.push(trimmed.replace(/^>\s+/, ''));
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      flushParagraph();
      flushQuote();
      listItems.push(trimmed.replace(/^-\s+/, ''));
      return;
    }

    paragraph.push(trimmed);
  });

  flushAll();
  return html.join('');
}

function stripMarkdown(markdown = '') {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^-\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSections(markdown = '') {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const sections = [];
  let title = '';
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    const raw = current.lines.join('\n').trim();
    sections.push({
      heading: current.heading,
      anchor: slugify(current.heading),
      raw,
      html: renderMarkdown(raw),
      text: stripMarkdown(raw),
    });
  };

  lines.forEach((line) => {
    if (!title && /^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, '').trim();
      return;
    }

    if (/^##\s+/.test(line)) {
      pushCurrent();
      current = { heading: line.replace(/^##\s+/, '').trim(), lines: [] };
      return;
    }

    if (!current) {
      current = { heading: 'Resumen', lines: [] };
    }

    current.lines.push(line);
  });

  pushCurrent();
  return { title, sections };
}

function getSectionByHeading(sections, heading) {
  return sections.find((section) => section.heading.toLowerCase() === heading.toLowerCase());
}

function extractAssets(section) {
  if (!section?.raw) return [];
  const lines = section.raw.replace(/\r\n/g, '\n').split('\n');
  const items = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const titleMatch = trimmed.match(/^-\s+\*\*(.+?)\*\*$/);
    if (titleMatch) {
      if (current) items.push(current);
      current = {
        title: titleMatch[1],
        status: 'pending',
        source: 'unknown',
        permission: 'unknown',
        note: '',
        description: 'Contenido pendiente.',
      };
      return;
    }

    if (!current) return;

    const propertyMatch = trimmed.match(/^-\s+([^:]+):\s*(.+)$/);
    if (!propertyMatch) return;

    const key = slugify(propertyMatch[1]);
    const value = propertyMatch[2].trim();

    if (key.includes('estado')) current.status = value.toLowerCase();
    if (key.includes('descripcion-esperada')) current.description = value;
    if (key === 'fuente') current.source = value;
    if (key === 'permiso') current.permission = value;
    if (key === 'nota') current.note = value;
  });

  if (current) items.push(current);
  return items;
}

function buildFallbackSections(day) {
  const pendingText = DAY_NOTES[day.slug] || 'Contenido pendiente de confirmación por el equipo de inducción.';
  return [
    {
      heading: 'Resumen',
      anchor: 'resumen',
      raw: pendingText,
      html: `<p>${escapeHtml(pendingText)}</p>`,
      text: pendingText,
    },
    {
      heading: day.slug === 'viernes' ? 'Bloque de exposición' : 'Agenda',
      anchor: day.slug === 'viernes' ? 'bloque-de-exposicion' : 'agenda',
      raw: 'Contenido pendiente.',
      html: '<p>Contenido pendiente.</p>',
      text: 'Contenido pendiente.',
    },
  ];
}

function sortSections(sections) {
  return [...sections].sort((left, right) => {
    const leftIndex = BASE_SECTION_ORDER.findIndex((value) => value.toLowerCase() === left.heading.toLowerCase());
    const rightIndex = BASE_SECTION_ORDER.findIndex((value) => value.toLowerCase() === right.heading.toLowerCase());
    const normalizedLeft = leftIndex === -1 ? 999 : leftIndex;
    const normalizedRight = rightIndex === -1 ? 999 : rightIndex;
    return normalizedLeft - normalizedRight;
  });
}

async function loadDay(day) {
  try {
    const response = await fetch(`./${day.slug}.md`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${day.slug}.md`);
    }

    const markdown = await response.text();
    const trimmed = markdown.trim();
    const parsed = parseSections(trimmed);
    const sections = trimmed ? sortSections(parsed.sections) : buildFallbackSections(day);
    const summarySection = getSectionByHeading(sections, 'Resumen');
    const expositionSection = getSectionByHeading(sections, 'Bloque de exposición');
    const institutionalSection = getSectionByHeading(sections, 'Bloque institucional SENA');
    const assetsSection = getSectionByHeading(sections, 'Assets pendientes');
    const isPending = !trimmed;

    return {
      ...day,
      title: parsed.title || `${day.label} — Contenido pendiente`,
      sections,
      summary: summarySection?.text || 'Contenido pendiente.',
      assets: extractAssets(assetsSection),
      hasInstitutionalBlock: Boolean(institutionalSection),
      hasExpositionBlock: Boolean(expositionSection) || day.slug === 'viernes',
      isPending,
    };
  } catch (error) {
    const sections = buildFallbackSections(day);
    return {
      ...day,
      title: `${day.label} — Contenido pendiente`,
      sections,
      summary: sections[0].text,
      assets: [],
      hasInstitutionalBlock: false,
      hasExpositionBlock: day.slug === 'viernes',
      isPending: true,
      error: error.message,
    };
  }
}

function buildSectionNav(dayData) {
  const visibleSections = dayData.sections.filter((section) => section.heading !== 'Assets pendientes');
  if (!visibleSections.length) {
    return '<p class="card__body">Contenido pendiente.</p>';
  }

  return `
    <div class="section-links">
      ${visibleSections
        .map(
          (section) => `
            <a class="section-link" href="#${dayData.slug}-${section.anchor}" data-target-id="${dayData.slug}-${section.anchor}">
              <span>${section.heading}</span>
              <span>Ir</span>
            </a>
          `,
        )
        .join('')}
    </div>
  `;
}

function buildStandardCard(dayData, section, extraClass = '') {
  return `
    <article class="card ${extraClass}" id="${dayData.slug}-${section.anchor}">
      <span class="card__eyebrow">${dayData.label}</span>
      <h3 class="card__title">${section.heading}</h3>
      <div class="card__body">${section.html}</div>
    </article>
  `;
}

function buildAssetsCard(dayData) {
  const assetMarkup = dayData.assets.length
    ? dayData.assets
        .map(
          (asset) => `
            <article class="asset-card">
              <span class="asset-chip">${escapeHtml(asset.status)}</span>
              <strong>${escapeHtml(asset.title)}</strong>
              <span>${escapeHtml(asset.description)}</span>
              <span>Fuente: ${escapeHtml(asset.source)}</span>
              <span>Permiso: ${escapeHtml(asset.permission)}</span>
              ${asset.note ? `<span>Nota: ${escapeHtml(asset.note)}</span>` : ''}
            </article>
          `,
        )
        .join('')
    : '<article class="asset-card"><strong>Sin assets cargados</strong><span>La jornada todavía no tiene fotos aprobadas.</span></article>';

  return `
    <article class="card card--wide card--pending" id="${dayData.slug}-assets-pendientes">
      <span class="card__eyebrow">Assets pendientes</span>
      <h3 class="card__title">Registro visual del día</h3>
      <div class="asset-list">${assetMarkup}</div>
    </article>
  `;
}

function renderDay(dayData, index) {
  const summarySection = getSectionByHeading(dayData.sections, 'Resumen');
  const agendaSection = getSectionByHeading(dayData.sections, 'Agenda');
  const themesSection = getSectionByHeading(dayData.sections, 'Temas');
  const responsibleSection = getSectionByHeading(dayData.sections, 'Responsables');
  const narrativeSection = getSectionByHeading(dayData.sections, 'Desarrollo de la jornada');
  const institutionalSection = getSectionByHeading(dayData.sections, 'Bloque institucional SENA');
  const expositionSection = getSectionByHeading(dayData.sections, 'Bloque de exposición');
  const pendingSection = getSectionByHeading(dayData.sections, 'Pendientes de verificación') || getSectionByHeading(dayData.sections, 'Pendientes de ampliación o confirmación');
  const remindersSection = getSectionByHeading(dayData.sections, 'Recordatorios');
  const rightsSection = getSectionByHeading(dayData.sections, 'Derechos, deberes y faltas del aprendiz');
  const additionalSection = getSectionByHeading(dayData.sections, 'Otros temas mencionados en la jornada');
  const sourcesSection = getSectionByHeading(dayData.sections, 'Fuentes institucionales verificadas');

  const cards = [
    buildStandardCard(dayData, agendaSection || { heading: 'Agenda', anchor: 'agenda', html: '<p>Contenido pendiente.</p>' }),
    buildStandardCard(dayData, themesSection || { heading: 'Temas', anchor: 'temas', html: '<p>Contenido pendiente.</p>' }),
    buildStandardCard(dayData, responsibleSection || { heading: 'Responsables', anchor: 'responsables', html: '<p>Contenido pendiente.</p>' }, 'card--tall'),
  ];

  if (narrativeSection) cards.push(buildStandardCard(dayData, narrativeSection, 'card--narrative'));
  if (rightsSection) cards.push(buildStandardCard(dayData, rightsSection, 'card--wide'));
  if (additionalSection) cards.push(buildStandardCard(dayData, additionalSection, 'card--wide'));
  if (institutionalSection) {
    cards.push(`
      <article class="card card--institutional" id="${dayData.slug}-${institutionalSection.anchor}">
        <span class="card__eyebrow">Miércoles institucional</span>
        <h3 class="card__title">Bloque institucional SENA</h3>
        <div class="card__body">${institutionalSection.html}</div>
        ${sourcesSection ? `<div class="institutional-source">${sourcesSection.html}</div>` : ''}
      </article>
    `);
  }

  if (dayData.slug === 'viernes') {
    cards.push(
      buildStandardCard(
        dayData,
        expositionSection || {
          heading: 'Bloque de exposición',
          anchor: 'bloque-de-exposicion',
          html: '<p>Espacio reservado para el cierre y la exposición final. Contenido pendiente.</p>',
        },
        'card--wide card--pending',
      ),
    );
  }

  if (pendingSection) cards.push(buildStandardCard(dayData, pendingSection, 'card--wide card--pending'));
  if (remindersSection) cards.push(buildStandardCard(dayData, remindersSection));
  cards.push(buildAssetsCard(dayData));

  return `
    <section class="slide" id="slide-${dayData.slug}" data-slide data-day="${dayData.slug}" data-index="${index + 1}" data-state="inactive">
      <div class="slide__inner">
        <header class="slide__header">
          <span class="eyebrow">Semana de inducción · ${dayData.label}</span>
          <div class="slide__header-row">
            <div>
              <h2 class="slide__title">${escapeHtml(dayData.title)}</h2>
              <p class="slide__summary">${escapeHtml(summarySection?.text || dayData.summary)}</p>
            </div>
            <span class="badge ${dayData.isPending ? 'badge--pending' : 'badge--available'}">${dayData.isPending ? 'Pendiente' : 'Disponible'}</span>
          </div>
        </header>

        <section class="day-grid">
          <article class="card card--wide">
            <span class="card__eyebrow">Navegación interna</span>
            <h3 class="card__title">Saltos rápidos por sección</h3>
            ${buildSectionNav(dayData)}
          </article>
          ${cards.join('')}
        </section>
      </div>
    </section>
  `;
}

function renderHero(days) {
  const availableDays = days.filter((day) => !day.isPending).length;
  return `
    <section class="slide" id="slide-hero" data-slide data-day="hero" data-index="0" data-state="active">
      <div class="slide__inner">
        <div class="hero__layout">
          <div class="slide__header">
            <span class="eyebrow">Inducción SENA · Experiencia semanal</span>
            <h1 class="hero__title">Una semana, cinco jornadas, un relato continuo.</h1>
            <p class="hero__lead">Esta landing toma los Markdown canónicos como fuente de verdad y los convierte en una experiencia tipo presentación: navegación rápida, transiciones fluidas y estados pendientes visibles cuando todavía falta información.</p>
            <div class="hero-actions">
              <a class="button-link button-link--primary" href="#slide-lunes">Empezar recorrido</a>
              <a class="button-link button-link--ghost" href="#slide-miercoles">Ir al bloque institucional</a>
            </div>
          </div>

          <aside class="hero-card">
            <span class="hero-card__label">Ruta semanal</span>
            <div class="hero-card__list">
              ${days
                .map(
                  (day, index) => `
                    <div class="hero-card__list-item">
                      <strong>${String(index + 1).padStart(2, '0')} · ${day.label}</strong>
                      <span>${day.isPending ? 'Pendiente' : 'Disponible'}</span>
                    </div>
                  `,
                )
                .join('')}
            </div>
            <dl class="hero-card__meta">
              <div class="meta-row"><dt>Días disponibles</dt><dd>${availableDays}/5</dd></div>
              <div class="meta-row"><dt>Bloque destacado</dt><dd>Miércoles institucional</dd></div>
              <div class="meta-row"><dt>Filosofía editorial</dt><dd>Sin inventar contenido</dd></div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  `;
}

function renderDayNav(days) {
  dayNav.innerHTML = days
    .map(
      (day, index) => `
        <button class="day-pill" type="button" data-jump-to="slide-${day.slug}" data-day-link="${day.slug}">
          <span class="day-pill__count">${index + 1}</span>
          <span class="day-pill__meta">
            <span class="day-pill__label">${day.label}</span>
            <span class="day-pill__title">${escapeHtml(day.title)}</span>
          </span>
          <span class="badge ${day.isPending ? 'badge--pending' : 'badge--available'}">${day.isPending ? 'Pending' : 'OK'}</span>
        </button>
      `,
    )
    .join('');
}

function renderDeck(days) {
  slidesTrack.innerHTML = `${renderHero(days)}${days.map(renderDay).join('')}`;
  renderDayNav(days);
}

async function init() {
  const days = await Promise.all(DAY_ORDER.map(loadDay));
  renderDeck(days);
  loadingState?.remove();

  document.dispatchEvent(
    new CustomEvent('landing:rendered', {
      detail: {
        days,
        totalSlides: days.length + 1,
      },
    }),
  );
}

init().catch(() => {
  if (loadingState) {
    loadingState.classList.add('empty-state');
    loadingState.innerHTML = '<strong>No se pudo cargar la experiencia.</strong><p>Revisá que `index.html` y los archivos Markdown estén sirviéndose desde la misma carpeta del proyecto.</p>';
  }
});
