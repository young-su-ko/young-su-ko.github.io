(() => {
  const article = document.querySelector('article');
  if (!article) return;

  const chunkTags = new Set(['H3', 'H4', 'H5', 'H6', 'P', 'BLOCKQUOTE', 'UL', 'OL', 'PRE', 'TABLE', 'FIGURE', 'CENTER']);

  const isImageElement = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.tagName === 'IMG') return true;
    return Boolean(node.querySelector(':scope > img, :scope > a > img'));
  };

  const isDisplayMathElement = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.classList.contains('katex-display')) return true;
    return node.children.length === 1 && node.firstElementChild.classList.contains('katex-display');
  };

  const isChunkElement = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.matches('[data-reading-mode-ignore], .post-title-row')) return false;
    if (chunkTags.has(node.tagName)) return true;
    if (node.classList.contains('highlighter-rouge')) return true;
    if (isImageElement(node)) return true;
    if (isDisplayMathElement(node)) return true;
    return false;
  };

  const isChunkTextNode = (node) => {
    return node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0;
  };

  let enabled = false;
  let wrappers = [];
  let index = 0;
  let wheelDebt = 0;
  let wheelLocked = false;
  let wheelGestureLocked = false;
  let wheelGestureTimer = null;
  let touchStartY = null;
  let contextBar = null;
  let progressOuter = null;
  let progressInner = null;
  let keyHint = null;
  let upKey = null;
  let downKey = null;

  const resistance = 200;
  const navigationLockMs = 120;
  const wheelNavigationLockMs = 200;
  const wheelGestureResetMs = 50;
  const wheelDragMax = 0.1;
  const wheelDragScale = 0.1;

  const isTypingTarget = (event) => {
    const element = event.target;
    return element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA' || element?.isContentEditable;
  };

  const hasShortcutModifier = (event) => event.metaKey || event.ctrlKey || event.altKey;

  const stripHeadingCounter = (text) => text.replace(/^\d+(?:\.\d+)*\.?\s+/, '').trim();

  const makeContextLabel = ({ title, section, subsection, subsubsection }) => {
    return [title, section, subsection, subsubsection].filter(Boolean).join(', ');
  };

  const getScrollTopFor = (element) => {
    const rect = element.getBoundingClientRect();
    return window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
  };

  const refreshRoughNotation = () => {
    window.dispatchEvent(new CustomEvent('rough-notation:refresh'));
  };

  const clearRoughNotation = () => {
    window.dispatchEvent(new CustomEvent('rough-notation:clear'));
  };

  const renderMathBeforeChunking = () => {
    if (!window.renderMathInElement) return;

    renderMathInElement(article, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      ignoredClasses: ['katex', 'katex-display'],
      throwOnError: false,
    });
  };

  const normalizeChunkNode = (node) => {
    if (isDisplayMathElement(node)) {
      node.classList.add('reading-mode-math-chunk');
      return node;
    }

    if (isImageElement(node)) {
      node.classList.add('reading-mode-image-chunk');
      return node;
    }

    if (!isChunkTextNode(node)) return node;

    const span = document.createElement('span');
    span.className = 'reading-mode-text-chunk';
    span.textContent = node.textContent.trim();
    node.parentNode.insertBefore(span, node);
    node.remove();
    return span;
  };

  const getChunkNodes = () => {
    const title = article.querySelector(':scope > .post-title-row h3, :scope > h3');
    const titleClone = title?.cloneNode(true);
    if (titleClone) titleClone.classList.add('reading-mode-title-chunk');

    return [
      ...(titleClone ? [titleClone] : []),
      ...article.childNodes,
    ]
      .filter((node) => isChunkElement(node) || isChunkTextNode(node))
      .map(normalizeChunkNode);
  };

  const buildChunks = () => {
    renderMathBeforeChunking();

    const nodes = getChunkNodes();
    const context = {
      title: article.querySelector(':scope > .post-title-row h3, :scope > h3')?.textContent.trim() || document.title,
      section: '',
      subsection: '',
      subsubsection: '',
    };
    const counters = {
      section: 0,
      subsection: 0,
      subsubsection: 0,
    };

    wrappers = nodes.map((node) => {
      const tag = node.tagName;
      const headingText = stripHeadingCounter(node.textContent);

      if (tag === 'H3') {
        context.title = headingText;
        context.section = '';
        context.subsection = '';
        context.subsubsection = '';
        counters.section = 0;
        counters.subsection = 0;
        counters.subsubsection = 0;
      } else if (tag === 'H4') {
        counters.section += 1;
        counters.subsection = 0;
        counters.subsubsection = 0;
        context.section = `${counters.section}. ${headingText}`;
        context.subsection = '';
        context.subsubsection = '';
      } else if (tag === 'H5') {
        counters.subsection += 1;
        counters.subsubsection = 0;
        context.subsection = `${counters.section}.${counters.subsection} ${headingText}`;
        context.subsubsection = '';
      } else if (tag === 'H6') {
        counters.subsubsection += 1;
        context.subsubsection = `${counters.section}.${counters.subsection}.${counters.subsubsection} ${headingText}`;
      }

      const wrapper = document.createElement('section');
      wrapper.className = 'reading-mode-chunk';
      wrapper.dataset.context = makeContextLabel(context);

      if (node.classList?.contains('reading-mode-title-chunk')) {
        article.insertBefore(wrapper, article.firstChild);
      } else {
        node.parentNode.insertBefore(wrapper, node);
      }
      wrapper.appendChild(node);

      return wrapper;
    });
  };

  const buildUi = () => {
    contextBar = document.createElement('div');
    contextBar.className = 'reading-mode-context';

    progressOuter = document.createElement('div');
    progressOuter.className = 'reading-mode-progress';

    progressInner = document.createElement('div');
    progressInner.className = 'reading-mode-progress-fill';
    progressOuter.appendChild(progressInner);

    keyHint = document.createElement('div');
    keyHint.className = 'reading-mode-key-hint';
    keyHint.setAttribute('aria-hidden', 'true');
    keyHint.innerHTML = `
      <div class="reading-mode-keys">
        <span class="reading-mode-key" data-reading-key="up">↑</span>
        <span class="reading-mode-key" data-reading-key="down">↓</span>
      </div>
      <span class="reading-mode-key-label">scroll</span>
    `;
    upKey = keyHint.querySelector('[data-reading-key="up"]');
    downKey = keyHint.querySelector('[data-reading-key="down"]');

    document.body.append(contextBar, progressOuter, keyHint);
  };

  const updateUi = () => {
    const active = wrappers[index];
    if (!active) return;

    contextBar.textContent = active.dataset.context || '';
    progressInner.style.width = `${((index + 1) / wrappers.length) * 100}%`;
  };

  const setActive = (nextIndex) => {
    index = Math.max(0, Math.min(wrappers.length - 1, nextIndex));

    wrappers.forEach((element) => {
      element.classList.remove('is-active');
      element.inert = true;
    });

    const active = wrappers[index];
    if (!active) return;

    active.inert = false;
    active.classList.add('is-active');

    updateUi();
  };

  const lockNavigationUntilSettled = (duration = navigationLockMs) => {
    wheelLocked = true;
    setTimeout(() => {
      wheelLocked = false;
    }, duration);
  };

  const getActiveChunk = () => wrappers[index];

  const clearWheelPreview = () => {
    const active = getActiveChunk();
    active?.style.removeProperty('--reading-drag-y');
    active?.classList.remove('is-wheel-primed');
    document.body.classList.remove('reading-mode-wheel-primed');
  };

  const updateWheelPreview = () => {
    const active = getActiveChunk();
    if (!active) return;

    const drag = Math.max(-wheelDragMax, Math.min(wheelDragMax, wheelDebt * wheelDragScale));
    const primed = Math.abs(wheelDebt) >= resistance;
    active.style.setProperty('--reading-drag-y', `${-drag}px`);
    active.classList.toggle('is-wheel-primed', primed);
    document.body.classList.toggle('reading-mode-wheel-primed', primed);
  };

  const resetWheelState = () => {
    clearWheelPreview();
    wheelDebt = 0;
  };

  const unlockWheelGestureSoon = () => {
    clearTimeout(wheelGestureTimer);
    wheelGestureTimer = setTimeout(() => {
      wheelGestureLocked = false;
      wheelGestureTimer = null;
    }, wheelGestureResetMs);
  };

  const pressKeyHint = (direction) => {
    const key = direction < 0 ? upKey : downKey;
    if (!key) return;

    key.classList.add('is-pressed');
    setTimeout(() => {
      key.classList.remove('is-pressed');
    }, 120);
  };

  const move = (direction, lockDuration = navigationLockMs, options = {}) => {
    if (wheelLocked) return;

    clearTimeout(wheelGestureTimer);
    wheelGestureTimer = null;
    wheelDebt = 0;
    if (!options.keepWheelGestureLocked) wheelGestureLocked = false;
    clearWheelPreview();

    const nextIndex = index + direction;
    if (nextIndex >= wrappers.length) {
      disable();
      return;
    }
    if (nextIndex < 0) {
      disable();
      return;
    }

    setActive(nextIndex);
    lockNavigationUntilSettled(lockDuration);
  };

  const onWheel = (event) => {
    event.preventDefault();
    if (wheelLocked) {
      resetWheelState();
      unlockWheelGestureSoon();
      return;
    }

    if (wheelGestureLocked) {
      unlockWheelGestureSoon();
      return;
    }

    wheelDebt += event.deltaY;
    updateWheelPreview();

    if (wheelDebt > resistance) {
      resetWheelState();
      wheelGestureLocked = true;
      unlockWheelGestureSoon();
      move(1, wheelNavigationLockMs, { keepWheelGestureLocked: true });
    } else if (wheelDebt < -resistance) {
      resetWheelState();
      wheelGestureLocked = true;
      unlockWheelGestureSoon();
      move(-1, wheelNavigationLockMs, { keepWheelGestureLocked: true });
    }
  };

  const onKeyDown = (event) => {
    if (isTypingTarget(event)) return;

    if (!hasShortcutModifier(event) && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      disable();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      disable();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      return;
    }

    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowDown') pressKeyHint(1);
      move(1);
    }

    if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowUp') pressKeyHint(-1);
      move(-1);
    }
  };

  const onTouchStart = (event) => {
    touchStartY = event.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (event) => {
    if (touchStartY == null) return;

    const endY = event.changedTouches[0]?.clientY ?? touchStartY;
    const delta = touchStartY - endY;

    if (Math.abs(delta) > 70) {
      move(delta > 0 ? 1 : -1);
    }

    touchStartY = null;
  };

  const enable = () => {
    if (enabled) return;

    enabled = true;
    clearRoughNotation();
    buildChunks();
    buildUi();

    document.body.classList.add('reading-mode-active');
    article.classList.add('reading-mode-active');

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    setActive(0);
    requestAnimationFrame(refreshRoughNotation);
  };

  function disable() {
    if (!enabled) return;

    enabled = false;
    clearRoughNotation();

    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);

    clearWheelPreview();

    wrappers.forEach((wrapper) => {
      wrapper.inert = false;
      while (wrapper.firstChild) {
        const child = wrapper.firstChild;
        if (child.classList?.contains('reading-mode-text-chunk')) {
          article.insertBefore(document.createTextNode(child.textContent), wrapper);
          child.remove();
        } else if (child.classList?.contains('reading-mode-title-chunk')) {
          child.remove();
        } else {
          child.classList?.remove('reading-mode-math-chunk', 'reading-mode-image-chunk');
          article.insertBefore(child, wrapper);
        }
      }
      wrapper.remove();
    });

    wrappers = [];
    article.classList.remove('reading-mode-active');
    document.body.classList.remove('reading-mode-active');
    contextBar?.remove();
    progressOuter?.remove();
    keyHint?.remove();
    contextBar = null;
    progressOuter = null;
    progressInner = null;
    keyHint = null;
    upKey = null;
    downKey = null;
    wheelDebt = 0;
    wheelGestureLocked = false;
    clearTimeout(wheelGestureTimer);
    wheelGestureTimer = null;
    wheelLocked = false;

    requestAnimationFrame(refreshRoughNotation);
  }

  const onGlobalShortcut = (event) => {
    if (isTypingTarget(event)) return;
    if (hasShortcutModifier(event)) return;
    if (event.key.toLowerCase() !== 'r') return;

    event.preventDefault();
    if (enabled) {
      disable();
    } else {
      enable();
    }
  };

  window.addEventListener('keydown', onGlobalShortcut);
})();
