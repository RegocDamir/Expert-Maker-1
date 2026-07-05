(() => {
  const OPEN_MENU_SELECTORS = [
    "[data-screen-settings-popover]",
    "[data-history-overlay]",
    "[data-holdup-overlay]",
    ".soundboard-settings-popover"
  ];

  let steps = [];
  let activeIndex = 0;
  let forcedElement = null;

  window.addEventListener("message", handleMessage);
  document.addEventListener("pointerdown", reportInteraction, true);
  document.addEventListener("touchstart", reportInteraction, true);
  document.addEventListener("click", reportInteraction, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", announceReady, { once: true });
  } else {
    announceReady();
  }

  function announceReady() {
    window.parent?.postMessage({ type: "SPACECAST_GUIDE_BRIDGE_READY" }, "*");
  }

  function handleMessage(event) {
    const message = event.data || {};
    if (message.type === "SPACECAST_GUIDE_CONFIG") {
      steps = Array.isArray(message.steps) ? message.steps : [];
      activeIndex = Number(message.activeIndex || 0);
      return;
    }

    if (message.type === "SPACECAST_GUIDE_CLEAR_FORCE") {
      clearForceShow();
      return;
    }

    if (message.type !== "SPACECAST_GUIDE_MEASURE") return;
    activeIndex = Number(message.activeIndex || 0);
    applyForceShow(message.forceShow);

    const rects = {};
    [...new Set(message.selectors || [])].forEach((selector) => {
      rects[selector] = measureSelector(selector);
    });

    window.parent?.postMessage({
      type: "SPACECAST_GUIDE_MEASURE_RESULT",
      requestId: message.requestId,
      rects
    }, "*");
  }

  function reportInteraction(event) {
    const direct = steps.findIndex((step) => closest(event.target, step.selector));
    const stepIndex = direct !== -1
      ? direct
      : steps.findIndex((step) => step.roots?.some((selector) => closest(event.target, selector)));

    const activeStep = steps[activeIndex] || null;
    window.parent?.postMessage({
      type: "SPACECAST_GUIDE_APP_INTERACTION",
      eventType: event.type,
      stepIndex,
      insideVisibleMenu: isInsideVisibleMenu(event.target),
      insideActiveStep: activeStep ? isInsideStep(event.target, activeStep) : false
    }, "*");
  }

  function measureSelector(selector) {
    const node = findVisible(selector) || document.querySelector(selector);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom
    };
  }

  function findVisible(selector) {
    return [...document.querySelectorAll(selector)].find((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    }) || null;
  }

  function applyForceShow(selector) {
    clearForceShow();
    if (!selector) return;
    forcedElement = document.querySelector(selector);
    if (!forcedElement) return;
    forcedElement.dataset.guidePreviousDisplay = forcedElement.style.display || "";
    forcedElement.style.display = "grid";
  }

  function clearForceShow() {
    if (!forcedElement) return;
    forcedElement.style.display = forcedElement.dataset.guidePreviousDisplay || "";
    delete forcedElement.dataset.guidePreviousDisplay;
    forcedElement = null;
  }

  function isInsideVisibleMenu(target) {
    return OPEN_MENU_SELECTORS.some((selector) => {
      const node = closest(target, selector);
      if (!node || node.hidden) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  function isInsideStep(target, step) {
    if (closest(target, step.selector)) return true;
    if (step.roots?.some((selector) => closest(target, selector))) return true;
    return step.details?.some((detail) => closest(target, detail.selector));
  }

  function closest(target, selector) {
    return target?.closest?.(selector) || null;
  }
})();
