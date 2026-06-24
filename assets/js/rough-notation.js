import { annotate } from 'https://unpkg.com/rough-notation?module';

const activeAnnotations = new Map();

const defaultColors = {
  light: {
    highlight: 'rgba(250, 255, 92, 0.66)',
    underline: '#2b60de',
    fallback: 'rgba(130, 255, 173, 0.55)',
  },
  dark: {
    highlight: 'rgba(230, 238, 7, 0.5)',
    underline: '#2b60de',
    fallback: 'rgba(130, 255, 173, 0.38)',
  },
};

const getTheme = () => document.documentElement.getAttribute('data-theme') || 'light';

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getColor = (element, type) => {
  if (element.dataset.roughColor) return element.dataset.roughColor;

  const theme = getTheme();
  if (theme === 'dark' && element.dataset.roughDarkColor) return element.dataset.roughDarkColor;
  if (theme !== 'dark' && element.dataset.roughLightColor) return element.dataset.roughLightColor;

  return defaultColors[theme]?.[type] || defaultColors[theme]?.fallback || defaultColors.light.fallback;
};

const getConfig = (element, overrides = {}) => {
  const type = overrides.type || element.dataset.roughNotation || 'highlight';
  const brackets = element.dataset.roughBrackets
    ? element.dataset.roughBrackets.split(',').map((bracket) => bracket.trim()).filter(Boolean)
    : undefined;

  return {
    type,
    color: getColor(element, type),
    strokeWidth: toNumber(element.dataset.roughStrokeWidth, 0.5),
    padding: toNumber(element.dataset.roughPadding, 1),
    animationDuration: toNumber(element.dataset.roughDuration, 250),
    multiline: element.dataset.roughMultiline !== 'false',
    iterations: toNumber(element.dataset.roughIterations, 1),
    ...(brackets ? { brackets } : {}),
    ...overrides,
  };
};

const annotateElement = (element, overrides, options = {}) => {
  if (activeAnnotations.has(element)) return;

  if (element.tagName?.toLowerCase() === 'img' && !element.complete) {
    element.addEventListener('load', () => annotateElement(element, overrides, options), { once: true });
    return;
  }

  const type = overrides?.type || element.dataset.roughNotation || 'highlight';
  const hasThemeColorOverride = Boolean(element.dataset.roughLightColor || element.dataset.roughDarkColor);
  const usesFixedColor = Boolean(element.dataset.roughColor) || type === 'underline';
  const annotation = annotate(element, getConfig(element, overrides));
  activeAnnotations.set(element, {
    annotation,
    type,
    themeAware: options.themeAware ?? (!usesFixedColor || hasThemeColorOverride),
  });
  annotation.show();
};

const clearAnnotations = () => {
  activeAnnotations.forEach(({ annotation }) => annotation.remove());
  activeAnnotations.clear();
};


const initRoughNotation = () => {
  document.querySelectorAll('[data-rough-notation]').forEach((element) => {
    annotateElement(element);
  });

  document.querySelectorAll('article blockquote > p').forEach((element) => {
    annotateElement(element, {
      type: 'bracket',
      brackets: ['left', 'right'],
      strokeWidth: toNumber(element.dataset.roughStrokeWidth, 1.5),
      padding: toNumber(element.dataset.roughPadding, 5),
      multiline: true,
      color: element.dataset.roughColor || '#f6474e',
    }, { themeAware: false });
  });
};

const updateThemeAwareAnnotationColors = () => {
  activeAnnotations.forEach(({ annotation, themeAware, type }, element) => {
    if (!themeAware) return;

    const color = getColor(element, type);
    const svg = annotation._svg;
    if (!svg) return;

    // RoughNotation redraws if its public color setter is used. Updating the
    // cached config and existing paths changes color without re-running the
    // hand-drawn animation.
    if (annotation._config) annotation._config.color = color;

    svg.querySelectorAll('path').forEach((path) => {
      path.setAttribute('stroke', color);
    });
  });
};

const watchThemeChanges = () => {
  const observer = new MutationObserver((mutations) => {
    const themeChanged = mutations.some((mutation) => mutation.attributeName === 'data-theme');
    if (themeChanged) requestAnimationFrame(updateThemeAwareAnnotationColors);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
};

const runWhenReady = () => {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initRoughNotation);
  } else {
    initRoughNotation();
  }

  watchThemeChanges();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runWhenReady);
} else {
  runWhenReady();
}
