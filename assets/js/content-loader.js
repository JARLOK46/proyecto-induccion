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

const DETAIL_SECTION_CONFIG = [
  {
    heading: 'Desarrollo de la jornada',
    kind: 'detail',
    kicker: 'Recorrido detallado',
    title: 'Desarrollo de la jornada',
  },
  {
    heading: 'Bloque institucional SENA',
    kind: 'detail',
    kicker: 'Bloque institucional',
    title: 'Bloque institucional SENA',
  },
  {
    heading: 'Derechos, deberes y faltas del aprendiz',
    kind: 'detail',
    kicker: 'Marco del aprendiz',
    title: 'Derechos, deberes y faltas del aprendiz',
  },
  {
    heading: 'Bloque de exposición',
    kind: 'detail',
    kicker: 'Cierre de la jornada',
    title: 'Bloque de exposición',
    forceForSlug: 'viernes',
    fallbackRaw: 'Espacio reservado para el cierre y la exposición final. Contenido pendiente.',
  },
  {
    heading: 'Otros temas mencionados en la jornada',
    kind: 'detail',
    kicker: 'Temas complementarios',
    title: 'Otros temas mencionados en la jornada',
  },
];

const DAY_NOTES = {
  jueves: 'Día todavía sin archivo desarrollado. La landing preserva el espacio para completarlo sin inventar contenido.',
  viernes: 'El cierre semanal reserva el bloque de exposición aunque la fuente Markdown siga vacía.',
};

const DAY_MEDIA = {
  lunes: {
    src: './public/img/lunes-img/WhatsApp Image 2026-04-22 at 7.31.13 PM.jpeg',
    alt: 'Registro real del lunes de inducción con exposición en aula.',
    caption: 'Registro real de la jornada en aula.',
  },
  martes: {
    src: './public/img/martes-img/WhatsApp Image 2026-04-22 at 7.31.45 PM.jpeg',
    alt: 'Registro real del martes de inducción con presentación del proyecto productivo.',
    caption: 'Foto real vinculada a la jornada activa.',
  },
  miercoles: {
    src: './public/img/miercoles-img/WhatsApp Image 2026-04-22 at 7.31.38 PM.jpeg',
    alt: 'Registro real del miércoles de inducción con explicación institucional.',
    caption: 'Registro real del bloque institucional y operativo.',
  },
  jueves: {
    src: './public/img/jueves-img/WhatsApp Image 2026-04-22 at 7.32.10 PM.jpeg',
    alt: 'Registro real del jueves de inducción disponible para el deck.',
    caption: 'Foto real reservada para la jornada del jueves.',
  },
  viernes: {
    src: './public/img/viernes-img/WhatsApp Image 2026-04-22 at 7.31.24 PM.jpeg',
    alt: 'Registro real del viernes de inducción con cierre de presentación.',
    caption: 'Registro real para el cierre de la semana.',
  },
};

const PRESENTATION_PRIORITIES = new Set(['lunes', 'martes', 'miercoles']);

const slidesTrack = document.querySelector('[data-slides-track]');
const dayNav = document.querySelector('[data-day-nav]');
const loadingState = document.querySelector('[data-loading]');

function escapeHtml(value = '') {
  return String(value)
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

function createShortSummary(value = '', maxLength = 64) {
  const normalized = stripMarkdown(value);
  if (!normalized) return 'Contenido pendiente de confirmación.';
  if (normalized.length <= maxLength) return normalized;

  const clipped = normalized.slice(0, maxLength + 1);
  const safeBreak = clipped.lastIndexOf(' ');
  const compact = (safeBreak > 42 ? clipped.slice(0, safeBreak) : clipped.slice(0, maxLength)).trim();
  return `${compact}…`;
}

function resolveDayMedia(day) {
  const media = DAY_MEDIA[day.slug];
  if (!media) return null;

  return {
    ...media,
    src: encodeURI(media.src),
  };
}

function resolveDayStatus(isPending) {
  return isPending ? 'pending' : 'available';
}

function getStatusLabel(status) {
  return status === 'pending' ? 'Pendiente' : 'Disponible';
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

function createSection(heading, raw = 'Contenido pendiente.') {
  return {
    heading,
    anchor: slugify(heading),
    raw,
    html: renderMarkdown(raw),
    text: stripMarkdown(raw),
  };
}

function createBulletedRaw(items = []) {
  return items.filter(Boolean).map((item) => `- ${item}`).join('\n');
}

function createParagraphRaw(paragraphs = []) {
  return paragraphs.filter(Boolean).join('\n\n');
}

function createEditorialBlock({
  heading,
  intro,
  paragraphs = [],
  highlights = [],
  bullets = [],
  tone = 'context',
  density = 'regular',
}) {
  const narrative = [intro, ...paragraphs].filter(Boolean);
  const text = [heading, ...narrative, ...highlights, ...bullets].join(' ');
  const html = `
    <div class="editorial-block">
      ${intro ? `<p class="editorial-block__lede">${renderInline(intro)}</p>` : ''}
      ${paragraphs.length
        ? `<div class="editorial-block__narrative">${paragraphs.map((paragraph) => `<p>${renderInline(paragraph)}</p>`).join('')}</div>`
        : ''}
      ${highlights.length
        ? `
          <div class="editorial-highlights" aria-label="Puntos destacados">
            ${highlights
              .map(
                (item) => `
                  <article class="editorial-highlight">
                    <span class="editorial-highlight__label">Clave</span>
                    <p>${renderInline(item)}</p>
                  </article>
                `,
              )
              .join('')}
          </div>
        `
        : ''}
      ${bullets.length
        ? `
          <ul class="editorial-bullets">
            ${bullets.map((item) => `<li>${renderInline(item)}</li>`).join('')}
          </ul>
        `
        : ''}
    </div>
  `;

  return buildBlock(createSection(heading, createParagraphRaw(narrative)), {
    heading,
    html,
    text,
    density,
    tone,
  });
}

function extractAssets(section) {
  if (!section?.raw) return [];
  const lines = section.raw.replace(/\r\n/g, '\n').split('\n');
  const items = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const titleMatch = trimmed.match(/^\-\s+\*\*(.+?)\*\*$/);
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

    const propertyMatch = trimmed.match(/^\-\s+([^:]+):\s*(.+)$/);
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
    createSection('Resumen', pendingText),
    createSection(day.slug === 'viernes' ? 'Bloque de exposición' : 'Agenda', 'Contenido pendiente.'),
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

function resolveBlockDensity(text = '') {
  const normalized = stripMarkdown(text);
  if (normalized.length > 620) return 'dense';
  if (normalized.length > 260) return 'regular';
  return 'compact';
}

function densityScore(density) {
  if (density === 'dense') return 3;
  if (density === 'regular') return 2;
  return 1;
}

function buildBlock(sectionLike, options = {}) {
  const raw = options.raw ?? sectionLike?.raw ?? '';
  const text = options.text ?? sectionLike?.text ?? stripMarkdown(raw);
  const html = options.html ?? sectionLike?.html ?? renderMarkdown(raw);
  const heading = options.heading ?? sectionLike?.heading ?? 'Contenido';
  const density = options.density ?? resolveBlockDensity(text || raw);

  return {
    id: options.id || slugify(`${heading}-${createShortSummary(text || heading, 32)}`),
    heading,
    html,
    text,
    density,
    tone: options.tone || 'default',
  };
}

function splitSectionIntoBlocks(section) {
  if (!section?.raw) return [];

  const lines = section.raw.replace(/\r\n/g, '\n').split('\n');
  const introLines = [];
  const blocks = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    const raw = current.lines.join('\n').trim();
    if (!raw) return;
    blocks.push(
      buildBlock(section, {
        heading: current.heading,
        raw,
        text: stripMarkdown(raw),
        html: renderMarkdown(raw),
      }),
    );
  };

  lines.forEach((line) => {
    if (/^###\s+/.test(line.trim())) {
      pushCurrent();
      current = {
        heading: line.replace(/^###\s+/, '').trim(),
        lines: [],
      };
      return;
    }

    if (current) {
      current.lines.push(line);
      return;
    }

    introLines.push(line);
  });

  pushCurrent();

  const introRaw = introLines.join('\n').trim();
  if (blocks.length) {
    if (introRaw) {
      blocks.unshift(
        buildBlock(section, {
          heading: `${section.heading} · contexto`,
          raw: introRaw,
          text: stripMarkdown(introRaw),
          html: renderMarkdown(introRaw),
          density: 'compact',
          tone: 'context',
        }),
      );
    }
    return blocks;
  }

  return [buildBlock(section)];
}

function chunkBlocks(blocks, pageKind) {
  const pageBudget = pageKind === 'cover' || pageKind === 'core' ? 4 : 3;
  const pages = [];
  let current = [];
  let score = 0;

  blocks.forEach((block) => {
    const nextScore = densityScore(block.density);
    const mustSplit = current.length >= 2 || score + nextScore > pageBudget || (block.density === 'dense' && current.length);

    if (mustSplit) {
      pages.push(current);
      current = [block];
      score = nextScore;
      return;
    }

    current.push(block);
    score += nextScore;
  });

  if (current.length) pages.push(current);
  return pages.filter((page) => page.length);
}

function buildAssetsMarkup(dayData) {
  if (!dayData.assets.length) {
    return '<article class="asset-card"><strong>Sin assets cargados</strong><span>La jornada todavía no tiene fotos aprobadas.</span></article>';
  }

  return dayData.assets
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
    .join('');
}

function buildPage(dayData, definition) {
  return {
    ...definition,
    summary: definition.summary || createShortSummary(definition.blocks.map((block) => block.text).join(' '), 110),
  };
}

function buildCuratedPresentationPages(dayData, definitionFactory) {
  const definitions = definitionFactory(dayData).filter(Boolean);
  return definitions.map((definition) => buildPage(dayData, definition));
}

function buildMondayPages(dayData) {
  return buildCuratedPresentationPages(dayData, () => [
    {
      kind: 'cover',
      variant: 'welcome-brief',
      kicker: 'Jornada 01',
      title: 'Bienestar, apoyos y reglas de inicio',
      summary: 'El lunes reunió bienestar al aprendiz, apoyos concretos, vida laboral y reglas básicas del aprendiz.',
      blocks: [
        createEditorialBlock({
          heading: 'Panorama del día',
          intro: 'La jornada abrió con bienestar al aprendiz, apoyos institucionales, actividades de desarrollo integral e inducción a la vida laboral.',
          paragraphs: ['También se socializaron derechos, deberes, faltas pendientes de verificación y la póliza de accidentes.'],
          highlights: [
            'Salud mental y bienestar aparecieron desde el arranque.',
            'La jornada mezcló apoyos, empleabilidad y reglas del aprendiz.',
          ],
          bullets: [
            'Actividades lúdicas y recreativas.',
            'Proyecto de vida y pruebas de trabajo.',
          ],
          tone: 'spotlight',
        }),
        buildBlock(createSection('Qué se llevó el grupo', createBulletedRaw([
          'Se explicaron apoyos institucionales disponibles para aprendices.',
          'Se presentó el beneficio de póliza de accidentes con coberturas y exclusiones.',
          'Quedó asignada la tarea sobre fundamentos de la formación integral y estructura organizacional.',
        ])), { heading: 'Qué se llevó el grupo', density: 'regular' }),
      ],
    },
    {
      kind: 'core',
      variant: 'support-matrix',
      kicker: 'Bienestar en concreto',
      title: 'Bienestar como apoyo real',
      summary: 'El bienestar apareció como salud mental, desarrollo integral y talleres para acompañar la formación.',
      blocks: [
        buildBlock(createSection('Bienestar integral', createBulletedRaw([
          'Se socializaron apoyos para salud mental de los estudiantes.',
          'También se mencionaron emprendimiento y desarrollo integral del aprendiz.',
          'Hubo espacios previstos para música y otros talleres lúdicos y recreativos.',
        ])), { heading: 'Bienestar integral', density: 'regular' }),
        buildBlock(createSection('Qué problema intenta resolver este bloque', createParagraphRaw([
          'La jornada presentó bienestar como acompañamiento al aprendiz más allá de la clase.',
          'Salud mental, actividades formativas y espacios de integración quedaron visibles desde el inicio.',
        ])), { heading: 'Qué problema intenta resolver este bloque', density: 'regular', tone: 'context' }),
      ],
    },
    {
      kind: 'core',
      variant: 'support-matrix',
      kicker: 'Apoyos institucionales',
      title: 'Apoyos nombrados con claridad',
      summary: 'El lunes dejó visibles los apoyos concretos mencionados durante la jornada.',
      blocks: [
        buildBlock(createSection('Apoyos que sí quedaron nombrados', createBulletedRaw([
          'Apoyo de transporte.',
          'Apoyo de alimentos.',
          'Apoyo de sostenimiento.',
          'Monitorías de excelencia.',
          'Apoyo de medios tecnológicos.',
        ])), { heading: 'Apoyos que sí quedaron nombrados', density: 'regular' }),
        buildBlock(createSection('Lectura útil para el aprendiz', createParagraphRaw([
          'Son apoyos que pueden afectar permanencia, acceso y rendimiento durante la formación.',
          'Por eso quedan separados como información accionable.',
        ])), { heading: 'Lectura útil para el aprendiz', density: 'regular', tone: 'context' }),
      ],
    },
    {
      kind: 'detail',
      variant: 'support-brief',
      kicker: 'Puente a la vida laboral',
      title: 'Vida laboral y tarea asignada',
      summary: 'Además de bienestar, el lunes abrió preparación laboral y dejó una tarea para seguir el recorrido.',
      blocks: [
        buildBlock(createSection('Inducción a la vida laboral', createParagraphRaw([
          'Se presentaron inducciones relacionadas con el desarrollo del proyecto de vida, pruebas de trabajo y otros temas vinculados con la preparación para la vida laboral.',
          'Quedó pendiente de aclaración el alcance exacto de “pruebas de trabajo y más”.',
        ])), { heading: 'Inducción a la vida laboral', density: 'regular' }),
        buildBlock(createSection('Tarea que baja a tierra la inducción', createBulletedRaw([
          'Fundamentos de la formación integral.',
          'Estructura organizacional.',
        ])), { heading: 'Tarea que baja a tierra la inducción', density: 'regular' }),
      ],
    },
    {
      kind: 'detail',
      variant: 'support-brief',
      kicker: 'Cobertura y límites',
      title: 'Póliza de accidentes: qué cubre y qué NO cubre',
      summary: 'La póliza se explicó con coberturas, exclusiones y contactos compartidos durante la jornada.',
      blocks: [
        buildBlock(createSection('Póliza de accidentes: lectura ejecutiva', createBulletedRaw([
          'La póliza cubre a aprendices del SENA durante la vigencia del seguro cuando sufran lesión orgánica o perturbación funcional causada por accidente.',
          'Entre las coberturas mencionadas estuvieron muerte accidental, incapacidad total permanente, desmembración accidental y auxilio funerario.',
          'Entre las exclusiones nombradas estuvieron enfermedades congénitas, actos por fuera de la ley, deportes de alto riesgo, alcohol o drogas, cirugías estéticas y accidentes de tránsito.',
        ])), { heading: 'Póliza de accidentes: lectura ejecutiva', density: 'regular' }),
        buildBlock(createSection('Dato operativo que quedó registrado', createBulletedRaw([
          'Se aclaró que el SENA no entrega medicamentos.',
          'Quedaron compartidas dos referencias de contacto: `#881` y `6017443718`.',
        ])), { heading: 'Dato operativo que quedó registrado', density: 'regular', tone: 'context' }),
      ],
    },
    {
      kind: 'support',
      variant: 'support-brief',
      kicker: 'Reglas del aprendiz',
      title: 'Derechos y deberes visibles',
      summary: 'El deck muestra lo respaldado por fuentes y mantiene faltas como pendiente de verificación.',
      blocks: [
        buildBlock(createSection('Derechos que sí aparecen respaldados', createBulletedRaw([
          'Recibir formación profesional integral.',
          'Acceder a recursos de formación y bienestar al aprendiz.',
          'Recibir orientación académica y trato digno.',
          'Contar con debido proceso y evaluación objetiva.',
        ])), { heading: 'Derechos que sí aparecen respaldados', density: 'regular' }),
        buildBlock(createSection('Deberes que sí quedaron explicitados', createBulletedRaw([
          'Cumplir las actividades del proceso formativo.',
          'Respetar a la comunidad educativa y los derechos de las demás personas.',
          'Cuidar recursos institucionales y usar correctamente ambientes y equipos.',
          'Conocer y asumir políticas institucionales y reglamento aplicable.',
        ])), { heading: 'Deberes que sí quedaron explicitados', density: 'regular' }),
        buildBlock(createSection('Límite editorial importante', createParagraphRaw([
          'El listado definitivo de faltas sigue pendiente de verificación oficial visible.',
        ])), { heading: 'Límite editorial importante', density: 'compact', tone: 'context' }),
      ],
    },
  ]);
}

function buildTuesdayPages(dayData) {
  return buildCuratedPresentationPages(dayData, () => [
    {
      kind: 'cover',
      variant: 'regulation-brief',
      kicker: 'Jornada 02',
      title: 'Reglamento del aprendiz y marco formativo',
      summary: 'El martes se concentró en reglamento, Acuerdo 069 de 2004 y formación profesional integral.',
      blocks: [
        createEditorialBlock({
          heading: 'Panorama del día',
          intro: 'La jornada se centró en el reglamento del aprendiz, la referencia al Acuerdo 069 de 2004 y la idea de formación profesional integral.',
          paragraphs: ['La slide deja visible sólo lo que quedó dicho y marca como pendiente lo no ampliado.'],
          highlights: [
            'El reglamento fue el centro del día.',
            'El Acuerdo 069 de 2004 quedó nombrado, sin redacción jurídica confirmada.',
          ],
          bullets: [
            'Definición de formación profesional integral.',
            'Ampliación de temas sobre derechos del aprendiz.',
          ],
          tone: 'spotlight',
        }),
        buildBlock(createSection('Decisión editorial del archivo', createParagraphRaw([
          'El desarrollo detallado de derechos, deberes y faltas queda consolidado en lunes.',
          'Así, martes funciona como slide de marco conceptual.',
        ])), { heading: 'Decisión editorial del archivo', density: 'regular' }),
      ],
    },
    {
      kind: 'core',
      variant: 'regulation-sheet',
      kicker: 'Marco regulatorio',
      title: 'Reglamento como eje del día',
      summary: 'La jornada puso el reglamento en el centro y dejó el Acuerdo 069 como referencia nombrada.',
      blocks: [
        buildBlock(createSection('Reglamento del aprendiz', createParagraphRaw([
          'Durante la jornada se trabajó el reglamento del aprendiz como uno de los ejes principales del martes.',
        ])), { heading: 'Reglamento del aprendiz', density: 'regular' }),
        buildBlock(createSection('Acuerdo 069 de 2004', createParagraphRaw([
          'También se hizo referencia al Acuerdo 069 de 2004 dentro del desarrollo de la sesión.',
          'No se incorpora redacción jurídica ni alcance detallado porque esa formulación exacta no fue aportada en la información recibida.',
        ])), { heading: 'Acuerdo 069 de 2004', density: 'regular', tone: 'context' }),
      ],
    },
    {
      kind: 'detail',
      variant: 'regulation-sheet',
      kicker: 'Punto clave del día',
      title: 'Ser, aprender y hacer',
      summary: 'La formación profesional integral quedó resumida en una tríada breve y clara.',
      blocks: [
        buildBlock(createSection('Definición revisada', createParagraphRaw([
          'Se explicó la formación profesional integral como la formación de los aprendices en el ser, aprender y hacer.',
        ])), { heading: 'Definición revisada', density: 'compact' }),
        buildBlock(createSection('Relación con derechos del aprendiz', createParagraphRaw([
          'En la jornada también se ampliaron temas sobre derechos del aprendiz.',
          'El desarrollo más amplio de derechos, deberes y faltas queda centralizado en `lunes.md`.',
        ])), { heading: 'Relación con derechos del aprendiz', density: 'regular' }),
        buildBlock(createSection('Limpieza de ruido', createBulletedRaw([
          'Se retiraron “actores de la formación profesional”.',
          'Se retiró “quién se considera aprendiz”.',
        ])), { heading: 'Limpieza de ruido', density: 'regular', tone: 'context' }),
      ],
    },
    {
      kind: 'support',
      variant: 'regulation-sheet',
      kicker: 'Pendientes reales',
      title: 'Lo que sigue pendiente',
      summary: 'El martes deja huecos documentales abiertos y el deck los muestra como pendientes.',
      blocks: [
        buildBlock(createSection('Pendientes de ampliación o confirmación', createBulletedRaw([
          'Precisar la formulación exacta con la que se trabajó el Acuerdo 069 de 2004.',
          'Confirmar si se revisaron artículos, apartados o ejemplos concretos del reglamento del aprendiz.',
          'Ampliar el contexto adicional con el que se explicó la formación profesional integral si aparecen apuntes o material de apoyo.',
        ])), { heading: 'Pendientes de ampliación o confirmación', density: 'regular' }),
        buildBlock(createSection('Criterio de esta presentación', createParagraphRaw([
          'No se incorpora redacción jurídica ni alcance detallado del acuerdo porque esa formulación exacta no fue aportada.',
        ])), { heading: 'Criterio de esta presentación', density: 'regular', tone: 'context' }),
      ],
    },
  ]);
}

function buildWednesdayPages(dayData) {
  return buildCuratedPresentationPages(dayData, () => [
    {
      kind: 'cover',
      variant: 'institutional-atlas',
      kicker: 'Jornada 03',
      title: 'Conociendo al SENA',
      summary: 'El miércoles ordena qué es el SENA, su misión, su estructura y los temas apenas mencionados.',
      blocks: [
        createEditorialBlock({
          heading: 'Panorama del día',
          intro: 'La jornada presentó qué es el SENA, su misión, su visión, su estructura y sus funciones principales.',
          paragraphs: ['SENNOVA, SISGE y SGVA quedaron mencionados, pero sin desarrollo adicional confirmado.'],
          highlights: [
            'Primero aparece la identidad institucional.',
            'Después se ubican plataformas y procesos mencionados.',
          ],
          bullets: [
            'Misión, visión y estructura organizacional.',
            'Funciones principales y símbolos institucionales.',
          ],
          tone: 'institutional',
        }),
        buildBlock(createSection('Idea fuerza', createParagraphRaw([
          'Este día construye contexto institucional para que el aprendiz entienda dónde está parado.',
        ])), { heading: 'Idea fuerza', density: 'compact' }),
      ],
    },
    {
      kind: 'detail',
      variant: 'institutional-atlas',
      kicker: 'Base institucional',
      title: 'Qué es el SENA y por qué existe',
      summary: 'La slide condensa la definición institucional y la conecta con la misión publicada por la entidad.',
      blocks: [
        buildBlock(createSection('Qué es el SENA', createParagraphRaw([
          'El SENA es un establecimiento público del orden nacional, con personería jurídica, patrimonio propio e independiente y autonomía administrativa, adscrito al Ministerio del Trabajo.',
          'Además, ofrece formación profesional integral gratuita para fortalecer el desarrollo social, económico y tecnológico del país.',
        ])), { heading: 'Qué es el SENA', density: 'regular' }),
        buildBlock(createSection('Misión en lectura rápida', createBulletedRaw([
          'La misión se centra en invertir en el desarrollo social y técnico de los trabajadores mediante formación profesional integral.',
          'La misión conecta formación con incorporación y desarrollo de personas en actividades productivas.',
          'No presenta sólo clases: presenta una función pública orientada al desarrollo social, económico y tecnológico del país.',
        ])), { heading: 'Misión en lectura rápida', density: 'regular' }),
      ],
    },
    {
      kind: 'detail',
      variant: 'institutional-atlas',
      kicker: 'Visión y organización',
      title: 'Visión y estructura',
      summary: 'La jornada aterrizó la visión hacia 2026 y la estructura organizacional del SENA.',
      blocks: [
        buildBlock(createSection('Visión institucional', createBulletedRaw([
          'La visión institucional publicada por el SENA está proyectada hacia 2026.',
          'Apunta a mantener a la entidad a la vanguardia de la cualificación del talento humano.',
          'La articulación esperada incluye formación, empleo, emprendimiento y reconocimiento de aprendizajes previos.',
        ])), { heading: 'Visión institucional', density: 'regular' }),
        buildBlock(createSection('Estructura organizacional', createBulletedRaw([
          'Consejo Directivo Nacional.',
          'Dirección General.',
          'Dependencias de apoyo y control.',
          'Direcciones misionales, direcciones regionales y centros de formación profesional integral.',
        ])), { heading: 'Estructura organizacional', density: 'regular' }),
      ],
    },
    {
      kind: 'detail',
      variant: 'institutional-atlas',
      kicker: 'Funciones visibles',
      title: 'Funciones y símbolos',
      summary: 'El miércoles dejó visibles funciones concretas del SENA y símbolos institucionales verificados.',
      blocks: [
        buildBlock(createSection('Funciones y símbolos destacados', createBulletedRaw([
          'Impulsar la formación profesional integral de los trabajadores.',
          'Ejecutar programas según necesidades sociales y del sector productivo.',
          'Administrar información relacionada con oferta y demanda laboral.',
          'Los símbolos institucionales verificados incluyen escudo, bandera y logosímbolo.',
        ])), { heading: 'Funciones y símbolos destacados', density: 'regular' }),
        buildBlock(createSection('Por qué este bloque importa', createParagraphRaw([
          'Esta parte explica para qué sirve institucionalmente y qué elementos permiten reconocerlo.',
        ])), { heading: 'Por qué este bloque importa', density: 'compact', tone: 'context' }),
      ],
    },
    {
      kind: 'support',
      variant: 'institutional-atlas',
      kicker: 'Temas abiertos',
      title: 'Plataformas mencionadas',
      summary: 'SENNOVA, SISGE y SGVA aparecieron en la jornada, pero siguen sin detalle confirmado.',
      blocks: [
        buildBlock(createSection('Temas mencionados durante el miércoles', createBulletedRaw([
          'Se explicó cómo funciona la plataforma SENNOVA.',
          'También se explicó cómo funciona la plataforma SISGE.',
          'Se mencionó el contrato de aprendizaje como forma en que las empresas contactan a los aprendices por medio de SGVA.',
        ])), { heading: 'Temas mencionados durante el miércoles', density: 'regular' }),
        buildBlock(createSection('Lo pendiente sigue marcado como pendiente', createBulletedRaw([
          'No se precisó qué módulo, flujo o uso concreto de SENNOVA y SISGE se explicó.',
          'No se agregan condiciones, requisitos o etapas del contrato de aprendizaje sin respaldo.',
        ])), { heading: 'Lo pendiente sigue marcado como pendiente', density: 'regular', tone: 'context' }),
      ],
    },
  ]);
}

function buildPriorityDayPages(dayData) {
  if (dayData.slug === 'lunes') return buildMondayPages(dayData);
  if (dayData.slug === 'martes') return buildTuesdayPages(dayData);
  if (dayData.slug === 'miercoles') return buildWednesdayPages(dayData);
  return null;
}

function buildGenericDayPages(dayData) {
  const sections = dayData.sections;
  const summarySection = getSectionByHeading(sections, 'Resumen') || createSection('Resumen', dayData.summary || DAY_NOTES[dayData.slug] || 'Contenido pendiente.');
  const agendaSection =
    getSectionByHeading(sections, 'Agenda') ||
    (dayData.slug === 'viernes'
      ? getSectionByHeading(sections, 'Bloque de exposición') || createSection('Bloque de exposición', 'Contenido pendiente.')
      : createSection('Agenda', 'Contenido pendiente.'));
  const themesSection = getSectionByHeading(sections, 'Temas');
  const responsibleSection = getSectionByHeading(sections, 'Responsables');
  const pendingSection = getSectionByHeading(sections, 'Pendientes de verificación') || getSectionByHeading(sections, 'Pendientes de ampliación o confirmación');
  const remindersSection = getSectionByHeading(sections, 'Recordatorios');
  const sourcesSection = getSectionByHeading(sections, 'Fuentes institucionales verificadas');

  const pages = [];

  pages.push(
    buildPage(dayData, {
      kind: 'cover',
      kicker: `Jornada ${dayData.label}`,
      title: dayData.title,
      summary: createShortSummary(summarySection.text || dayData.summary, 110),
      blocks: [buildBlock(summarySection, { heading: 'Resumen', density: 'regular' }), buildBlock(agendaSection, { heading: agendaSection.heading, density: 'regular' })],
    }),
  );

  const coreBlocks = [themesSection, responsibleSection].filter(Boolean).map((section) => buildBlock(section));
  if (coreBlocks.length) {
    pages.push(
      buildPage(dayData, {
        kind: 'core',
        kicker: 'Mapa de la jornada',
        title: 'Temas y responsables',
        summary: createShortSummary(coreBlocks.map((block) => block.text).join(' '), 110),
        blocks: coreBlocks,
      }),
    );
  }

  DETAIL_SECTION_CONFIG.forEach((config) => {
    const sourceSection = getSectionByHeading(sections, config.heading);
    const shouldRender = Boolean(sourceSection) || config.forceForSlug === dayData.slug;
    if (!shouldRender) return;

    const section = sourceSection || createSection(config.heading, config.fallbackRaw || 'Contenido pendiente.');
    const blockGroups = chunkBlocks(splitSectionIntoBlocks(section), config.kind);

    blockGroups.forEach((group, pageIndex) => {
      const totalGroups = blockGroups.length;
      const pageTitle = totalGroups > 1 ? `${config.title} · tramo ${pageIndex + 1}` : config.title;
      pages.push(
        buildPage(dayData, {
          kind: config.kind,
          kicker: config.kicker,
          title: pageTitle,
          summary: createShortSummary(section.text || dayData.summary, 110),
          blocks: group,
        }),
      );
    });
  });

  const supportBlocks = [pendingSection, remindersSection, sourcesSection].filter(Boolean).map((section) => buildBlock(section));
  if (supportBlocks.length) {
    chunkBlocks(supportBlocks, 'support').forEach((group) => {
      pages.push(
        buildPage(dayData, {
          kind: 'support',
          kicker: 'Soporte editorial',
          title: 'Pendientes, recordatorios y fuentes',
          summary: createShortSummary(group.map((block) => block.text).join(' '), 110),
          blocks: group,
        }),
      );
    });
  }

  pages.push(
    buildPage(dayData, {
      kind: 'support',
      kicker: 'Registro visual',
      title: 'Assets pendientes',
      summary: dayData.assets.length
        ? `${dayData.assets.length} asset${dayData.assets.length === 1 ? '' : 's'} registrados para esta jornada.`
        : 'La jornada todavía no tiene assets aprobados.',
      blocks: [
        buildBlock(
          { heading: 'Assets pendientes', raw: '' },
          {
            heading: 'Assets pendientes',
            html: `<div class="asset-list">${buildAssetsMarkup(dayData)}</div>`,
            text: dayData.assets.map((asset) => `${asset.title} ${asset.description}`).join(' ') || 'Sin assets cargados',
            density: 'regular',
            tone: dayData.assets.length ? 'default' : 'context',
          },
        ),
      ],
    }),
  );

  return pages;
}

function buildDayPages(dayData) {
  const pages = PRESENTATION_PRIORITIES.has(dayData.slug) ? buildPriorityDayPages(dayData) || buildGenericDayPages(dayData) : buildGenericDayPages(dayData);

  return pages.map((page, index, collection) => ({
    ...page,
    id: `${dayData.slug}-${String(index + 1).padStart(2, '0')}`,
    progressLabel: `${dayData.label} · página ${index + 1}/${collection.length}`,
    pageNumber: index + 1,
    totalPages: collection.length,
  }));
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
    const agendaSection = getSectionByHeading(sections, 'Agenda');
    const expositionSection = getSectionByHeading(sections, 'Bloque de exposición');
    const institutionalSection = getSectionByHeading(sections, 'Bloque institucional SENA');
    const assetsSection = getSectionByHeading(sections, 'Assets pendientes');
    const isPending = !trimmed;
    const status = resolveDayStatus(isPending);

    const dayData = {
      ...day,
      title: parsed.title || `${day.label} — Contenido pendiente`,
      sections,
      summary: summarySection?.text || 'Contenido pendiente.',
      shortSummary: createShortSummary(summarySection?.text || agendaSection?.text || DAY_NOTES[day.slug] || parsed.title || day.label),
      status,
      media: resolveDayMedia(day),
      assets: extractAssets(assetsSection),
      hasInstitutionalBlock: Boolean(institutionalSection),
      hasExpositionBlock: Boolean(expositionSection) || day.slug === 'viernes',
      isPending,
    };

    dayData.pages = buildDayPages(dayData);
    return dayData;
  } catch (error) {
    const sections = buildFallbackSections(day);
    const status = resolveDayStatus(true);
    const dayData = {
      ...day,
      title: `${day.label} — Contenido pendiente`,
      sections,
      summary: sections[0].text,
      shortSummary: createShortSummary(sections[0].text),
      status,
      media: resolveDayMedia(day),
      assets: [],
      hasInstitutionalBlock: false,
      hasExpositionBlock: day.slug === 'viernes',
      isPending: true,
      error: error.message,
    };

    dayData.pages = buildDayPages(dayData);
    return dayData;
  }
}

function renderBlock(block) {
  return `
    <article class="page-block page-block--${block.density} page-block--${block.tone}">
      <header class="page-block__header">
        <h3 class="page-block__title">${escapeHtml(block.heading)}</h3>
      </header>
      <div class="page-block__body">${block.html}</div>
    </article>
  `;
}

function renderPageStepper(dayData, pageIndex) {
  return `
    <div class="page-stepper" aria-label="Páginas internas de ${escapeHtml(dayData.label)}">
      ${dayData.pages
        .map(
          (page, index) => `
            <button
              class="page-stepper__button ${index === pageIndex ? 'is-active' : ''}"
              type="button"
              data-page-jump="${index}"
              aria-current="${index === pageIndex ? 'true' : 'false'}"
              aria-label="Ir a la página ${index + 1}: ${escapeHtml(page.title)}"
              title="${escapeHtml(page.title)}"
            >
              <span class="page-stepper__index">${String(index + 1).padStart(2, '0')}</span>
            </button>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderPageFooter(dayData, dayIndex, pageIndex, flatIndex, totalDeckPages) {
  const progress = totalDeckPages <= 1 ? 100 : (flatIndex / (totalDeckPages - 1)) * 100;
  const isFirstPage = flatIndex === 0;
  const isLastPage = flatIndex === totalDeckPages - 1;

  return `
    <footer class="slide__footer" aria-label="Navegación de la presentación">
      <div class="slide__footer-progress" aria-label="Avance de la presentación">
        <span class="slide__footer-copy">Jornada ${dayIndex + 1}/${DAY_ORDER.length} · Página ${pageIndex + 1}/${dayData.pages.length}</span>
        <div class="progress" aria-hidden="true">
          <div class="progress__bar" style="width: ${progress}%"></div>
        </div>
        <span class="slide__footer-total">Semana ${flatIndex + 1}/${totalDeckPages}</span>
      </div>

      <div class="slide__footer-nav">
        ${renderPageStepper(dayData, pageIndex)}
        <div class="slide__footer-actions" aria-label="Navegación secuencial">
          <button class="control-button control-button--inline" type="button" data-action="previous" aria-label="Página o jornada anterior" ${isFirstPage ? 'disabled' : ''}>← Anterior</button>
          <button class="control-button control-button--inline" type="button" data-action="next" aria-label="Página o jornada siguiente" ${isLastPage ? 'disabled' : ''}>Siguiente →</button>
        </div>
      </div>
    </footer>
  `;
}

function renderDayMedia(dayData, page) {
  if (!dayData.media) return '';

  return `
    <aside class="slide__media" aria-label="Registro visual de ${escapeHtml(dayData.label)}">
      <figure class="slide__media-frame">
        <div class="slide__media-window">
          <img
            class="slide__media-backdrop"
            src="${dayData.media.src}"
            alt=""
            loading="lazy"
            decoding="async"
            aria-hidden="true"
          />
          <img
            class="slide__media-image"
            src="${dayData.media.src}"
            alt="${escapeHtml(dayData.media.alt)}"
            loading="lazy"
            decoding="async"
          />
        </div>

        <figcaption class="slide__media-caption">
          <div class="slide__media-caption-top">
            <span class="slide__media-eyebrow">Registro real</span>
            <span class="slide__media-tag">${escapeHtml(page.kicker || dayData.label)}</span>
          </div>
          <strong class="slide__media-title">${escapeHtml(dayData.label)}</strong>
          <p class="slide__media-copy">${escapeHtml(dayData.media.caption)}</p>
        </figcaption>
      </figure>
    </aside>
  `;
}

function renderPage(dayData, dayIndex, page, pageIndex, flatIndex, totalDeckPages) {
  return `
    <section
      class="slide slide--day slide--${page.kind} ${page.variant ? `slide--${page.variant}` : ''}"
      id="page-${page.id}"
      data-page
      data-state="inactive"
      data-day="${dayData.slug}"
      data-day-index="${dayIndex}"
      data-page-index="${pageIndex}"
      data-day-label="${escapeHtml(dayData.label)}"
      data-day-summary="${escapeHtml(dayData.shortSummary)}"
      data-page-label="${escapeHtml(page.title)}"
      data-page-summary="${escapeHtml(page.summary)}"
      data-page-kind="${page.kind}"
      data-page-variant="${escapeHtml(page.variant || '')}"
      data-day-total="${dayData.pages.length}"
      aria-hidden="true"
      hidden
    >
      <div class="slide__inner">
        <header class="slide__header">
          <div class="slide__marker">
            <span class="slide__marker-step">Jornada ${String(dayIndex + 1).padStart(2, '0')}</span>
            <span class="slide__marker-line" aria-hidden="true"></span>
            <span class="slide__marker-page">Página ${String(pageIndex + 1).padStart(2, '0')} / ${String(dayData.pages.length).padStart(2, '0')}</span>
          </div>
          <span class="eyebrow">${escapeHtml(page.kicker)}</span>
          <div class="slide__header-row">
            <div>
              <h2 class="slide__title">${escapeHtml(page.title)}</h2>
              <p class="slide__summary">${escapeHtml(page.summary)}</p>
            </div>
            <span class="badge ${dayData.status === 'pending' ? 'badge--pending' : 'badge--available'}">${getStatusLabel(dayData.status)}</span>
          </div>
        </header>

        <section class="page-panel page-panel--${page.kind}">
          <div class="page-panel__grid">
            ${page.blocks.map(renderBlock).join('')}
          </div>
        </section>

        ${renderPageFooter(dayData, dayIndex, pageIndex, flatIndex, totalDeckPages)}
      </div>

      ${renderDayMedia(dayData, page)}
    </section>
  `;
}

function renderDayNav(days) {
  if (!dayNav) return;

  dayNav.innerHTML = days
    .map(
      (day, index) => `
        <button
          class="day-pill"
          type="button"
          data-day-link
          data-day-index="${index}"
          data-day-status="${day.status}"
          aria-label="Ir a ${day.label}"
        >
          <span class="day-pill__count">${String(index + 1).padStart(2, '0')}</span>
          <span class="day-pill__label">${day.label}</span>
          <span class="day-pill__state" aria-hidden="true"></span>
        </button>
      `,
    )
    .join('');
}

function renderDeck(days) {
  if (!slidesTrack) return;

  const totalDeckPages = days.reduce((total, currentDay) => total + currentDay.pages.length, 0);

  slidesTrack.innerHTML = days
    .map((day, dayIndex) => {
      const previousPages = days.slice(0, dayIndex).reduce((total, currentDay) => total + currentDay.pages.length, 0);
      return day.pages
        .map((page, pageIndex) => renderPage(day, dayIndex, page, pageIndex, previousPages + pageIndex, totalDeckPages))
        .join('');
    })
    .join('');
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
        totalPages: days.reduce((total, day) => total + day.pages.length, 0),
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
