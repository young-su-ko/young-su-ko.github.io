import { annotate } from 'https://unpkg.com/rough-notation?module';

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getConfig = (element, overrides = {}) => {
  const brackets = element.dataset.roughBrackets
    ? element.dataset.roughBrackets.split(',').map((bracket) => bracket.trim()).filter(Boolean)
    : undefined;

  return {
    type: element.dataset.roughNotation || 'highlight',
    color: element.dataset.roughColor || 'rgba(250, 255, 92, 0.66)',
    strokeWidth: toNumber(element.dataset.roughStrokeWidth, 0.5),
    padding: toNumber(element.dataset.roughPadding, 1),
    animationDuration: toNumber(element.dataset.roughDuration, 250),
    multiline: element.dataset.roughMultiline !== 'false',
    iterations: toNumber(element.dataset.roughIterations, 1),
    ...(brackets ? { brackets } : {}),
    ...overrides,
  };
};

const annotateElement = (element, overrides) => {
  if (element.dataset.roughNotationReady) return;

  const annotation = annotate(element, getConfig(element, overrides));

  element.dataset.roughNotationReady = 'true';
  annotation.show();
};

const initRoughNotation = () => {
  document.querySelectorAll('[data-rough-notation]').forEach((element) => {
    annotateElement(element);
  });

  document.querySelectorAll('article blockquote > p').forEach((element) => {
    annotateElement(element, {
      type: 'bracket',
      brackets: ['left', 'right'],
      color: element.dataset.roughColor || '#f6474e',
      strokeWidth: toNumber(element.dataset.roughStrokeWidth, 1.5),
      padding: toNumber(element.dataset.roughPadding, 5),
      multiline: true,
    });
  });
};

const runWhenReady = () => {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initRoughNotation);
  } else {
    initRoughNotation();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runWhenReady);
} else {
  runWhenReady();
}
