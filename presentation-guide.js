(() => {
  const STORAGE_KEY = "expert_maker_overlay_layout_v1";
  const urlParams = new URLSearchParams(window.location.search);
  const OUTPUT_MODE = urlParams.get("output") === "1";
  const RENDER_MODE = urlParams.get("render") === "1";
  const STAGE_WIDTH = 1920;
  const BASE_STAGE_HEIGHT = 1080;
  let STAGE_HEIGHT = 1080;
  const DEFAULT_APP_WIDTH = 500;
  const DEFAULT_APP_HEIGHT = 950;
  let APP_WIDTH = DEFAULT_APP_WIDTH;
  let APP_HEIGHT = DEFAULT_APP_HEIGHT;
  const DEFAULT_TIMING = { appear: 0.18, stay: 7.2, disappear: 0.18 };
  const DEFAULT_BACKGROUND = {
    color: "#050505",
    accent: "#9778ff",
    x: 50,
    y: 18,
    spread: 38,
    layers: []
  };
  const DEFAULT_BACKGROUND_LAYER = {
    type: "blob",
    colorA: "#ff4fd8",
    colorB: "#35f4ff",
    x: 50,
    y: 50,
    width: 68,
    height: 38,
    rotate: 0,
    opacity: 0.42,
    hardness: 44,
    blur: 18,
    count: 40,
    sizeMin: 6,
    sizeMax: 28,
    seed: 1
  };
  const DEFAULT_TEXT_OVERLAY = {
    text: "New text",
    x: 960,
    y: 200,
    size: 64,
    color: "#ffffff",
    anim: "none",
    animSpeed: 1.2,
    animDir: "left",
    shadow: 0,
    tiltX: 0,
    tiltY: 0,
    curveX: 0,
    curveY: 0,
    font: ""
  };
  const TEXT_OVERLAY_ANIMS = ["none", "glitch", "rise", "drop", "slide"];
  const TEXT_OVERLAY_FONTS = [
    { label: "Default", value: "" },
    { label: "Roboto", value: "'Roboto', sans-serif" },
    { label: "DM Sans", value: "'DM Sans', sans-serif" },
    { label: "Lilita One", value: "'Lilita One', system-ui, sans-serif" },
    { label: "Lora", value: "'Lora', serif" },
    { label: "Montserrat", value: "'Montserrat', sans-serif" },
    { label: "Oswald", value: "'Oswald', sans-serif" },
    { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
    { label: "Playfair Display", value: "'Playfair Display', serif" },
    { label: "Poppins", value: "'Poppins', sans-serif" },
    { label: "Architype Bayer", value: "'Architype Bayer', 'Lilita One', sans-serif" }
  ];
  const TEXT_OVERLAY_FONT_VALUES = TEXT_OVERLAY_FONTS.map((font) => font.value);
  const DEFAULT_FRAME_STYLE = {
    titleColor: "#ffffff",
    titleSize: 18,
    copyColor: "#d7d3e2",
    copySize: 13,
    numberColor: "#ffffff",
    numberBg: "#9c64fb",
    cardBorderWidth: 1,
    cardBorderColor: "#d8c8ff",
    cardBorderOpacity: 1,
    cardRadius: 8,
    cardBg: "#13121e",
    color: "#d8c8ff",
    width: 2,
    borderOpacity: 1,
    radius: 8,
    glowColor: "#9e68ff",
    glowSpread: 26,
    glowIntensity: 0.72,
    outerColor: "#ffffff",
    outerWidth: 1,
    outerRadius: 12,
    outerGap: 6
  };
  const OPEN_MENU_SELECTORS = [
    "[data-screen-settings-popover]",
    "[data-history-overlay]",
    "[data-holdup-overlay]",
    ".soundboard-settings-popover"
  ];

  const steps = [
    {
      id: "surface",
      title: "Target Surface",
      selector: ".target-surface",
      copy: "This is the clean surface under the overlay. Load a screenshot, a page URL, or leave it as a background, then use Edit to move frames and cards.",
      focusZoom: 1,
      details: [
        { selector: "[data-guide-target='primary']", number: "1", text: "Start here, then replace this placeholder with the interface or screenshot you want." }
      ]
    },
    {
      id: "primary",
      title: "First Callout",
      selector: "[data-guide-target='primary']",
      copy: "Use this as your first reusable callout. In Edit mode, drag the frame/card, resize the frame, and rewrite the text directly.",
      focusZoom: 1.08,
      details: []
    }
  ];
  let activeIndex = 0;
  let paused = false;
  let editMode = false;
  let saved = normalizeSaved(readSaved());
  let timer = 0;
  let exitTimer = 0;
  let drag = null;
  let frame;
  let appLayer;
  let layer;
  let backgroundEffects;
  let card;
  let detailHost;
  let overlayHost;
  let focusDrag;
  let alignMenu;
  let marquee;
  let imageDrop;
  let imageInput;
  let appDoc;
  let forcedElement = null;
  let selectedDetail = null;
  let selectedItems = [];
  const colorTargets = new Map();
  let lastColorTarget = null;
  let borderControlDrag = null;
  let colorControlDrag = null;
  let tiltControlDrag = null;
  let textControlDrag = null;
  let fontControlDrag = null;
  let bridgeReady = false;
  let started = false;
  let activeBackgroundLayer = 0;
  let activeTextOverlay = 0;
  let measureRequestId = 0;
  let latestBridgeRender = 0;
  let lastAppInteractionAt = 0;
  let appInteractionPauseAt = 0;
  const pendingMeasures = new Map();
  const undoStack = [];
  const redoStack = [];

  const controls = {
    play: null,
    edit: null,
    reset: null,
    openOutput: null,
    renderPreset: null,
    renderWidth: null,
    renderHeight: null,
    renderVideo: null,
    exportData: null,
    exportStatus: null,
    editor: null,
    step: null,
    addStep: null,
    deleteStep: null,
    appear: null,
    stay: null,
    disappear: null,
    focusZoom: null,
    appWidth: null,
    appHeight: null,
    bgColor: null,
    bgAccent: null,
    bgX: null,
    bgY: null,
    bgSpread: null,
    bgLayer: null,
    bgAddLayer: null,
    bgDeleteLayer: null,
    bgLayerType: null,
    bgLayerColorA: null,
    bgLayerColorB: null,
    bgLayerX: null,
    bgLayerY: null,
    bgLayerWidth: null,
    bgLayerHeight: null,
    bgLayerRotate: null,
    bgLayerOpacity: null,
    bgLayerHardness: null,
    bgLayerBlur: null,
    bgLayerCount: null,
    bgLayerSizeMinRange: null,
    bgLayerSizeMaxRange: null,
    bgLayerSizeMin: null,
    bgLayerSizeMax: null,
    titleColor: null,
    titleSize: null,
    copyColor: null,
    copySize: null,
    numberColor: null,
    numberBg: null,
    cardBorderWidth: null,
    cardBorderColor: null,
    cardRadius: null,
    cardBg: null,
    frameColor: null,
    frameWidth: null,
    frameRadius: null,
    glowColor: null,
    glowSpread: null,
    glowIntensity: null,
    outerColor: null,
    outerWidth: null,
    outerRadius: null,
    outerGap: null,
    overlaySelect: null,
    overlayAdd: null,
    overlayDelete: null,
    overlayText: null,
    overlaySize: null,
    overlayColor: null,
    overlayAnim: null,
    overlayAnimSpeed: null,
    overlayAnimDir: null,
    overlayShadow: null,
    overlayTiltX: null,
    overlayTiltY: null,
    overlayFont: null,
    addBox: null,
    deleteBox: null,
    removeImage: null,
    addFields: [],
    undo: null,
    redo: null,
    applyAll: []
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    frame = document.querySelector(".capture-frame");
    appLayer = document.querySelector("[data-app-layer]");
    layer = document.querySelector("[data-guide-layer]");
    if (!frame || !appLayer || !layer) return;
    backgroundEffects = document.querySelector("[data-background-effects]");
    document.body.classList.toggle("capture-output", OUTPUT_MODE);
    document.body.classList.toggle("capture-render", RENDER_MODE);
    loadCustomSteps();
    applyAppSize(getAppSize());
    applyBackground(getBackground());

    layer.innerHTML = `
      <div class="guide-scrim"></div>
      <div class="guide-focus-drag" data-guide-drag="focus" aria-hidden="true"></div>
      <div class="guide-frame" data-guide-drag="frame">
        <span class="guide-resize is-nw" data-guide-resize="nw"></span>
        <span class="guide-resize is-ne" data-guide-resize="ne"></span>
        <span class="guide-resize is-sw" data-guide-resize="sw"></span>
        <span class="guide-resize is-se" data-guide-resize="se"></span>
        <span class="guide-border-control is-width" data-guide-border-control="width" role="slider" aria-label="Border thickness" tabindex="0"></span>
        <span class="guide-border-control is-opacity" data-guide-border-control="opacity" role="slider" aria-label="Border transparency" tabindex="0"></span>
        <span class="guide-border-control is-radius" data-guide-border-control="radius" role="slider" aria-label="Border radius" tabindex="0"></span>
        <button type="button" class="guide-delete-handle" data-guide-delete-handle aria-label="Delete element"></button>
      </div>
      <section class="guide-card" data-guide-drag="card" aria-live="polite">
        <div class="guide-kicker"><span data-guide-progress></span></div>
        <div class="guide-card-meta" data-guide-card-meta></div>
        <h2 class="guide-title" data-guide-card-field="title"></h2>
        <p class="guide-copy" data-guide-card-field="text"></p>
        <img class="guide-card-image" alt="" data-guide-card-field="image" hidden>
        <span class="guide-tilt-control" data-guide-tilt-control aria-label="3D perspective control"></span>
        <span class="guide-resize is-nw" data-guide-resize="nw"></span>
        <span class="guide-resize is-ne" data-guide-resize="ne"></span>
        <span class="guide-resize is-sw" data-guide-resize="sw"></span>
        <span class="guide-resize is-se" data-guide-resize="se"></span>
        <span class="guide-border-control is-width" data-guide-border-control="width" role="slider" aria-label="Border thickness" tabindex="0"></span>
        <span class="guide-border-control is-opacity" data-guide-border-control="opacity" role="slider" aria-label="Border transparency" tabindex="0"></span>
        <span class="guide-border-control is-radius" data-guide-border-control="radius" role="slider" aria-label="Border radius" tabindex="0"></span>
        <span class="guide-color-control" data-guide-color-control role="button" aria-label="Text color" tabindex="0"></span>
        <button type="button" class="guide-delete-handle" data-guide-delete-handle aria-label="Delete element"></button>
      </section>
      <div data-guide-details></div>
      <div data-guide-overlays></div>
      <div class="guide-marquee" data-guide-marquee hidden></div>
      <div class="guide-image-drop" data-guide-image-drop hidden>Drop image</div>
      <div class="guide-align-menu" data-guide-align-menu hidden>
        <button type="button" data-guide-align="left">Left</button>
        <button type="button" data-guide-align="top">Top</button>
        <button type="button" data-guide-align="right">Right</button>
        <button type="button" data-guide-align="bottom">Bottom</button>
        <button type="button" data-guide-align="distributeX">Distribute X</button>
        <button type="button" data-guide-align="distributeY">Distribute Y</button>
      </div>
    `;

    card = layer.querySelector(".guide-card");
    detailHost = layer.querySelector("[data-guide-details]");
    overlayHost = layer.querySelector("[data-guide-overlays]");
    focusDrag = layer.querySelector(".guide-focus-drag");
    alignMenu = layer.querySelector("[data-guide-align-menu]");
    marquee = layer.querySelector("[data-guide-marquee]");
    imageDrop = layer.querySelector("[data-guide-image-drop]");
    bindFloatingControlHandles(layer);
    setupBackgroundPanel();
    setupGroupApplyControls();
    bindControls();
    bindDrag();
    window.addEventListener("message", handleBridgeMessage);
    bindFrameLoad();
    window.SpaceCastGuide = {
      pause: () => pauseOnStep(activeIndex, false),
      resume: resumeGuide,
      toggle: () => (paused ? resumeGuide() : pauseOnStep(activeIndex, false)),
      edit: (on) => setEditMode(Boolean(on)),
      resetStep: resetCurrentStep,
      exportState: () => normalizeSaved(JSON.parse(JSON.stringify(saved))),
      restartForExport,
      getExportTimeline
    };
    window.addEventListener("storage", handleStorageUpdate);
  }

  function bindControls() {
    controls.play = document.querySelector("[data-guide-play]");
    controls.edit = document.querySelector("[data-guide-edit]");
    controls.reset = document.querySelector("[data-guide-reset]");
    controls.openOutput = document.querySelector("[data-guide-open-output]");
    controls.renderPreset = document.querySelector("[data-guide-render-preset]");
    controls.renderWidth = document.querySelector("[data-guide-render-width]");
    controls.renderHeight = document.querySelector("[data-guide-render-height]");
    controls.renderVideo = document.querySelector("[data-guide-render-video]");
    controls.exportData = document.querySelector("[data-guide-export-data]");
    controls.exportStatus = document.querySelector("[data-guide-export-status]");
    controls.editor = document.querySelector("[data-guide-editor]");
    controls.step = document.querySelector("[data-guide-step]");
    controls.addStep = document.querySelector("[data-guide-add-step]");
    controls.deleteStep = document.querySelector("[data-guide-delete-step]");
    controls.appear = document.querySelector("[data-guide-appear]");
    controls.stay = document.querySelector("[data-guide-stay]");
    controls.disappear = document.querySelector("[data-guide-disappear]");
    controls.focusZoom = document.querySelector("[data-guide-focus-zoom]");
    controls.appWidth = document.querySelector("[data-guide-app-width]");
    controls.appHeight = document.querySelector("[data-guide-app-height]");
    controls.bgColor = document.querySelector("[data-guide-bg-color]");
    controls.bgAccent = document.querySelector("[data-guide-bg-accent]");
    controls.bgX = document.querySelector("[data-guide-bg-x]");
    controls.bgY = document.querySelector("[data-guide-bg-y]");
    controls.bgSpread = document.querySelector("[data-guide-bg-spread]");
    controls.bgLayer = document.querySelector("[data-guide-bg-layer]");
    controls.bgAddLayer = document.querySelector("[data-guide-bg-add-layer]");
    controls.bgDeleteLayer = document.querySelector("[data-guide-bg-delete-layer]");
    controls.bgLayerType = controls.bgLayer;
    controls.bgLayerColorA = document.querySelector("[data-guide-bg-layer-color-a]");
    controls.bgLayerColorB = document.querySelector("[data-guide-bg-layer-color-b]");
    controls.bgLayerX = document.querySelector("[data-guide-bg-layer-x]");
    controls.bgLayerY = document.querySelector("[data-guide-bg-layer-y]");
    controls.bgLayerWidth = document.querySelector("[data-guide-bg-layer-width]");
    controls.bgLayerHeight = document.querySelector("[data-guide-bg-layer-height]");
    controls.bgLayerRotate = document.querySelector("[data-guide-bg-layer-rotate]");
    controls.bgLayerOpacity = document.querySelector("[data-guide-bg-layer-opacity]");
    controls.bgLayerHardness = document.querySelector("[data-guide-bg-layer-hardness]");
    controls.bgLayerBlur = document.querySelector("[data-guide-bg-layer-blur]");
    controls.bgLayerCount = document.querySelector("[data-guide-bg-layer-count]");
    controls.bgLayerSizeMinRange = document.querySelector("[data-guide-bg-layer-size-min-range]");
    controls.bgLayerSizeMaxRange = document.querySelector("[data-guide-bg-layer-size-max-range]");
    controls.bgLayerSizeMin = document.querySelector("[data-guide-bg-layer-size-min]");
    controls.bgLayerSizeMax = document.querySelector("[data-guide-bg-layer-size-max]");
    controls.overlaySelect = document.querySelector("[data-guide-overlay-select]");
    controls.overlayAdd = document.querySelector("[data-guide-overlay-add]");
    controls.overlayDelete = document.querySelector("[data-guide-overlay-delete]");
    controls.overlayText = document.querySelector("[data-guide-overlay-text]");
    controls.overlaySize = document.querySelector("[data-guide-overlay-size]");
    controls.overlayColor = document.querySelector("[data-guide-overlay-color]");
    controls.overlayAnim = document.querySelector("[data-guide-overlay-anim]");
    controls.overlayAnimSpeed = document.querySelector("[data-guide-overlay-anim-speed]");
    controls.overlayAnimDir = document.querySelector("[data-guide-overlay-anim-dir]");
    controls.overlayShadow = document.querySelector("[data-guide-overlay-shadow]");
    controls.overlayTiltX = document.querySelector("[data-guide-overlay-tilt-x]");
    controls.overlayTiltY = document.querySelector("[data-guide-overlay-tilt-y]");
    controls.overlayFont = document.querySelector("[data-guide-overlay-font]");
    if (controls.overlayFont) {
      controls.overlayFont.innerHTML = TEXT_OVERLAY_FONTS
        .map((font) => `<option value="${escapeHtml(font.value)}">${escapeHtml(font.label)}</option>`)
        .join("");
    }
    controls.titleColor = document.querySelector("[data-guide-title-color]");
    controls.titleSize = document.querySelector("[data-guide-title-size]");
    controls.copyColor = document.querySelector("[data-guide-copy-color]");
    controls.copySize = document.querySelector("[data-guide-copy-size]");
    controls.numberColor = document.querySelector("[data-guide-number-color]");
    controls.numberBg = document.querySelector("[data-guide-number-bg]");
    controls.cardBorderWidth = document.querySelector("[data-guide-card-border-width]");
    controls.cardBorderColor = document.querySelector("[data-guide-card-border-color]");
    controls.cardRadius = document.querySelector("[data-guide-card-radius]");
    controls.cardBg = document.querySelector("[data-guide-card-bg]");
    controls.frameColor = document.querySelector("[data-guide-frame-color]");
    controls.frameWidth = document.querySelector("[data-guide-frame-width]");
    controls.frameRadius = document.querySelector("[data-guide-frame-radius]");
    controls.glowColor = document.querySelector("[data-guide-glow-color]");
    controls.glowSpread = document.querySelector("[data-guide-glow-spread]");
    controls.glowIntensity = document.querySelector("[data-guide-glow-intensity]");
    controls.outerColor = document.querySelector("[data-guide-outer-color]");
    controls.outerWidth = document.querySelector("[data-guide-outer-width]");
    controls.outerRadius = document.querySelector("[data-guide-outer-radius]");
    controls.outerGap = document.querySelector("[data-guide-outer-gap]");
    controls.addBox = document.querySelector("[data-guide-add-box]");
    controls.deleteBox = document.querySelector("[data-guide-delete-box]");
    controls.removeImage = document.querySelector("[data-guide-remove-image]");
    controls.addFields = Array.from(document.querySelectorAll("[data-guide-add-field]"));
    controls.undo = document.querySelector("[data-guide-undo]");
    controls.redo = document.querySelector("[data-guide-redo]");
    controls.applyAll = Array.from(document.querySelectorAll("[data-guide-apply-all]"));

    updateStepOptions();

    controls.play?.addEventListener("click", () => (paused ? resumeGuide() : pauseOnStep(activeIndex, false)));
    controls.edit?.addEventListener("click", () => setEditMode(!editMode));
    controls.reset?.addEventListener("click", resetCurrentStep);
    controls.openOutput?.addEventListener("click", openOutputWindow);
    controls.renderPreset?.addEventListener("change", applyRenderPreset);
    controls.renderWidth?.addEventListener("input", markCustomRenderPreset);
    controls.renderHeight?.addEventListener("input", markCustomRenderPreset);
    controls.renderVideo?.addEventListener("click", renderVideoFromUi);
    controls.exportData?.addEventListener("click", downloadRenderData);
    controls.bgLayer?.addEventListener("change", saveEditorValues);
    controls.bgAddLayer?.addEventListener("click", addBackgroundLayer);
    controls.bgDeleteLayer?.addEventListener("click", deleteBackgroundLayer);
    controls.bgLayerSizeMinRange?.addEventListener("input", syncBackgroundSizeRange);
    controls.bgLayerSizeMaxRange?.addEventListener("input", syncBackgroundSizeRange);
    bindBackgroundRangeDrag();
    controls.overlayAdd?.addEventListener("click", addTextOverlay);
    controls.overlayDelete?.addEventListener("click", deleteTextOverlay);
    controls.overlaySelect?.addEventListener("change", () => {
      activeTextOverlay = Number(controls.overlaySelect.value) || 0;
      selectedItems = [{ type: "overlay", overlayIndex: activeTextOverlay }];
      renderStep();
    });
    [
      controls.overlayText,
      controls.overlaySize,
      controls.overlayColor,
      controls.overlayAnim,
      controls.overlayAnimSpeed,
      controls.overlayAnimDir,
      controls.overlayShadow,
      controls.overlayTiltX,
      controls.overlayTiltY,
      controls.overlayFont
    ].forEach((input) => {
      input?.addEventListener("input", saveOverlayValues);
      input?.addEventListener("change", saveOverlayValues);
    });
    controls.addStep?.addEventListener("click", addStep);
    controls.deleteStep?.addEventListener("click", deleteStep);
    controls.step?.addEventListener("change", () => {
      activeIndex = Number(controls.step.value) || 0;
      clearSelection(false);
      pauseOnStep(activeIndex, false);
    });

    controls.addBox?.addEventListener("click", addManualBox);
    controls.deleteBox?.addEventListener("click", deleteSelectedBox);
    controls.removeImage?.addEventListener("click", removeImageFromSelectedCard);
    controls.addFields.forEach((button) => {
      button.addEventListener("click", () => addFieldToSelectedCard(button.dataset.guideAddField));
    });
    controls.undo?.addEventListener("click", undoEdit);
    controls.redo?.addEventListener("click", redoEdit);
    alignMenu?.addEventListener("click", handleAlignMenuClick);

    [
      controls.appear,
      controls.stay,
      controls.disappear,
      controls.focusZoom,
      controls.appWidth,
      controls.appHeight,
      controls.bgColor,
      controls.bgAccent,
      controls.bgX,
      controls.bgY,
      controls.bgSpread,
      controls.bgLayerType,
      controls.bgLayerColorA,
      controls.bgLayerColorB,
      controls.bgLayerX,
      controls.bgLayerY,
      controls.bgLayerWidth,
      controls.bgLayerHeight,
      controls.bgLayerRotate,
      controls.bgLayerOpacity,
      controls.bgLayerHardness,
      controls.bgLayerBlur,
      controls.bgLayerCount,
      controls.bgLayerSizeMin,
      controls.bgLayerSizeMax,
      controls.titleColor,
      controls.titleSize,
      controls.copyColor,
      controls.copySize,
      controls.numberColor,
      controls.numberBg,
      controls.cardBorderWidth,
      controls.cardBorderColor,
      controls.cardRadius,
      controls.cardBg,
      controls.frameColor,
      controls.frameWidth,
      controls.frameRadius,
      controls.glowColor,
      controls.glowSpread,
      controls.glowIntensity,
      controls.outerColor,
      controls.outerWidth,
      controls.outerRadius,
      controls.outerGap
    ].forEach((input) => {
      input?.addEventListener("input", saveEditorValues);
      input?.addEventListener("change", saveEditorValues);
    });
    controls.applyAll.forEach((input) => {
      input.addEventListener("change", saveEditorValues);
    });
    installNumberSteppers();
    imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";
    imageInput.hidden = true;
    imageInput.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      imageInput.value = "";
      if (file) attachImageFileToSelection(file);
    });
    document.body.appendChild(imageInput);
  }

  function setupBackgroundPanel() {
    const editor = document.querySelector("[data-guide-editor]");
    const group = document.querySelector(".guide-group-background");
    if (!editor || !group || group.dataset.bgPanelReady === "true") return;

    const legend = group.querySelector("legend");
    const content = document.createElement("div");
    content.className = "guide-bg-content";
    Array.from(group.children).forEach((child) => {
      if (child !== legend) content.appendChild(child);
    });

    group.appendChild(content);
    group.classList.add("is-collapsed");
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute("aria-expanded", "false");
    group.addEventListener("click", (event) => {
      if (event.target.closest(".guide-bg-content")) return;
      toggleBackgroundPanel(group);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest(".guide-bg-content")) return;
      event.preventDefault();
      toggleBackgroundPanel(group);
    });
    group.dataset.bgPanelReady = "true";
    editor.insertBefore(group, document.querySelector(".guide-history-controls"));
    const exportGroup = document.querySelector(".capture-export-group");
    if (exportGroup) group.after(exportGroup);
  }

  function setupGroupApplyControls() {
    document.querySelectorAll(".guide-editor-group").forEach((group) => {
      if (group.querySelector(":scope > .guide-apply-group")) return;
      const legend = group.querySelector("legend");
      const groupName = legend?.textContent?.trim() || "Group";
      const control = document.createElement("label");
      control.className = "guide-apply-group";
      const text = document.createElement("span");
      text.textContent = "Apply To Group";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.guideApplyGroup = groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      control.append(input, text);
      const collapsible = group.querySelector(":scope > .guide-bg-content");
      (collapsible || group).appendChild(control);
      input.addEventListener("change", () => {
        group.querySelectorAll("[data-guide-apply-all]").forEach((applyInput) => {
          applyInput.checked = input.checked;
          applyInput.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
    });
  }


  function toggleBackgroundPanel(group) {
    const expanded = !group.classList.contains("is-open");
    group.classList.toggle("is-open", expanded);
    group.setAttribute("aria-expanded", String(expanded));
  }

  function installNumberSteppers() {
    document.querySelectorAll(".capture-controls input[type='number']").forEach((input) => {
      if (input.closest(".guide-number-wrap")) return;
      const wrapper = document.createElement("span");
      wrapper.className = "guide-number-wrap";
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      wrapper.appendChild(createNumberStepButton(input, "up"));
      wrapper.appendChild(createNumberStepButton(input, "down"));
    });
  }

  function createNumberStepButton(input, direction) {
    const dir = direction === "up" ? 1 : -1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `guide-number-step is-${direction}`;
    button.setAttribute("aria-label", direction === "up" ? "Increase value" : "Decrease value");

    const HOLD_DELAY = 250;      // ms before auto-repeat kicks in (so a tap = one step)
    const DRAG_THRESHOLD = 5;    // px of in-direction drag that engages fast mode early
    let raf = 0;
    let startTime = 0;
    let lastTime = 0;
    let accumulator = 0;
    let pointerStartY = 0;
    let dragInDir = 0;

    function stop(event) {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
      try { button.releasePointerCapture?.(event.pointerId); } catch (_) {}
    }

    function tick(now) {
      if (input.disabled) { raf = 0; return; }
      const dtMs = Math.min(64, now - lastTime);
      lastTime = now;
      const heldMs = now - startTime;

      if (heldMs >= HOLD_DELAY || dragInDir >= DRAG_THRESHOLD) {
        const heldSec = Math.max(0, heldMs - HOLD_DELAY) / 1000;
        // Hold: accelerates the longer it's held. Drag: in-direction distance adds big speed.
        const stepsPerSec = 6 + heldSec * heldSec * 32 + dragInDir * 16;
        accumulator += (stepsPerSec * dtMs) / 1000;
        const whole = Math.floor(accumulator);
        if (whole > 0) {
          accumulator -= whole;
          advanceNumberInput(input, dir * whole);
        }
      }
      raf = requestAnimationFrame(tick);
    }

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (input.disabled) return;
      input.focus();
      advanceNumberInput(input, dir);          // immediate single step on press
      pointerStartY = event.clientY;
      dragInDir = 0;
      accumulator = 0;
      startTime = lastTime = performance.now();
      try { button.setPointerCapture?.(event.pointerId); } catch (_) {}
      if (!raf) raf = requestAnimationFrame(tick);
    });

    button.addEventListener("pointermove", (event) => {
      if (!raf) return;
      // Dragging in the direction the triangle points ramps speed toward the extreme.
      dragInDir = Math.max(0, (pointerStartY - event.clientY) * dir);
    });

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
    return button;
  }

  function advanceNumberInput(input, steps) {
    if (!input || input.disabled || !steps) return;
    const stepAttr = Math.abs(Number.parseFloat(input.step)) || 1;
    const min = input.min !== "" ? Number.parseFloat(input.min) : -Infinity;
    const max = input.max !== "" ? Number.parseFloat(input.max) : Infinity;
    const current = Number.parseFloat(input.value);
    const base = Number.isFinite(current) ? current : (Number.isFinite(min) ? min : 0);
    let next = base + steps * stepAttr;
    next = Math.min(max, Math.max(min, next));
    const decimals = (String(stepAttr).split(".")[1] || "").length;
    next = Number.parseFloat(next.toFixed(decimals));
    if (next === current) return;
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function bindDrag() {
    layer.addEventListener("pointerdown", rememberColorTargetFromEvent, true);
    layer.addEventListener("pointerdown", beginDrag);
    layer.addEventListener("input", saveTextEdit);
    layer.addEventListener("dragenter", handleImageDrag);
    layer.addEventListener("dragover", handleImageDrag);
    layer.addEventListener("dragleave", handleImageDragLeave);
    layer.addEventListener("drop", handleImageDrop);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("resize", renderStep);
    window.addEventListener("keydown", handleGuideKeydown);
    document.addEventListener("click", handleParentClick);
  }

  function handleGuideKeydown(event) {
    if (!editMode) return;
    const key = event.key.toLowerCase();
    const isTextTarget = Boolean(event.target.closest?.("input, textarea, [contenteditable='true']"));
    if (!isTextTarget && key === ",") {
      event.preventDefault();
      moveStep(-1);
      return;
    }
    if (!isTextTarget && key === ".") {
      event.preventDefault();
      moveStep(1);
      return;
    }

    if (!event.ctrlKey && !event.metaKey) return;
    if (event.target.closest?.("input, select, textarea, [contenteditable='true']")) return;

    if (key === "z" && event.shiftKey) {
      event.preventDefault();
      redoEdit();
    } else if (key === "z") {
      event.preventDefault();
      undoEdit();
    } else if (key === "y") {
      event.preventDefault();
      redoEdit();
    }
  }

  function bindFrameLoad() {
    let isReady = false;
    const ready = () => {
      if (isReady) return;
      try {
        appDoc = frame.contentDocument;
      } catch (_) {
        appDoc = null;
      }
      if (!appDoc || !appDoc.body) return;
      isReady = true;
      appDoc.addEventListener("pointerdown", handleAppInteraction, true);
      appDoc.addEventListener("touchstart", handleAppInteraction, true);
      appDoc.addEventListener("click", handleAppInteraction, true);
      layer.hidden = false;
      startGuideOnce();
    };

    frame.addEventListener("load", ready);
    frame.addEventListener("load", postBridgeConfig);
    ready();
    window.setTimeout(ready, 50);
    window.setTimeout(ready, 250);
    window.setTimeout(ready, 750);
  }

  function startGuideOnce() {
    if (started) {
      renderStep();
      return;
    }
    started = true;
    layer.hidden = false;
    startGuide();
  }

  function handleBridgeMessage(event) {
    if (event.source !== frame?.contentWindow) return;
    const message = event.data || {};

    if (message.type === "SPACECAST_GUIDE_BRIDGE_READY") {
      bridgeReady = true;
      postBridgeConfig();
      if (!appDoc) startGuideOnce();
      return;
    }

    if (message.type === "SPACECAST_GUIDE_MEASURE_RESULT") {
      const resolve = pendingMeasures.get(message.requestId);
      if (!resolve) return;
      pendingMeasures.delete(message.requestId);
      resolve(message.rects || {});
      return;
    }

    if (message.type === "SPACECAST_GUIDE_APP_INTERACTION" || message.type === "SPACECAST_GUIDE_APP_CLICK") {
      handleBridgeInteraction(message);
    }
  }

  function handleBridgeInteraction(message) {
    if (editMode) return;
    if (skipDuplicateAppInteraction()) return;
    if (!paused) {
      appInteractionPauseAt = performance.now();
      pauseOnStep(activeIndex, false);
      window.setTimeout(renderStep, 80);
      window.setTimeout(renderStep, 260);
      return;
    }

    if (message.stepIndex !== -1 || message.insideVisibleMenu || message.insideActiveStep) {
      window.setTimeout(renderStep, 80);
      window.setTimeout(renderStep, 260);
      return;
    }
    if (message.eventType && message.eventType !== "click") return;
    if (performance.now() - appInteractionPauseAt < 650) return;
    resumeGuide();
  }

  function postBridgeConfig() {
    frame?.contentWindow?.postMessage({
      type: "SPACECAST_GUIDE_CONFIG",
      activeIndex,
      steps: steps.map((step) => ({
        selector: step.selector,
        roots: step.roots || [],
        details: getRenderableDetails(step, getStepState(step)).map((detail) => ({ selector: detail.selector })).filter((detail) => detail.selector)
      }))
    }, "*");
  }

  function startGuide() {
    activeIndex = 0;
    paused = false;
    editMode = false;
    clearSelection(false);
    layer.classList.remove("is-exiting");
    renderStep();
    scheduleNext();
    updateControls();
  }

  function scheduleNext() {
    window.clearTimeout(timer);
    window.clearTimeout(exitTimer);
    if (paused || editMode) return;

    const timing = getTiming(steps[activeIndex]);
    const totalMs = Math.max(1000, Math.round(getDuration(timing) * 1000));
    const exitMs = Math.round(timing.disappear * 1000);
    if (exitMs > 0 && exitMs < totalMs) {
      exitTimer = window.setTimeout(() => layer.classList.add("is-exiting"), totalMs - exitMs);
    }
    timer = window.setTimeout(() => {
      activeIndex = (activeIndex + 1) % steps.length;
      clearSelection(false);
      postBridgeConfig();
      layer.classList.remove("is-exiting");
      renderStep();
      scheduleNext();
    }, totalMs);
  }

  function handleParentClick(event) {
    if (!paused || editMode) return;
    if (event.target.closest?.(".capture-controls")) return;
    if (event.target.closest?.(".presentation-guide-layer")) return;
    if (!event.target.closest?.(".capture-app-layer")) {
      resumeGuide();
    }
  }

  function handleAppInteraction(event) {
    if (editMode) return;
    if (skipDuplicateAppInteraction()) return;
    const stepIndex = findClickedStep(event.target);
    if (!paused) {
      appInteractionPauseAt = performance.now();
      pauseOnStep(activeIndex, false);
      window.setTimeout(renderStep, 80);
      window.setTimeout(renderStep, 260);
      return;
    }

    if (stepIndex !== -1 || isInsideVisibleMenu(event.target) || isInsideStep(event.target, steps[activeIndex])) {
      window.setTimeout(renderStep, 80);
      window.setTimeout(renderStep, 260);
      return;
    }
    if (event.type !== "click") return;
    if (performance.now() - appInteractionPauseAt < 650) return;
    resumeGuide();
  }

  function skipDuplicateAppInteraction() {
    const now = performance.now();
    if (now - lastAppInteractionAt < 80) return true;
    lastAppInteractionAt = now;
    return false;
  }

  function findClickedStep(target) {
    const direct = steps.findIndex((step) => closestInApp(target, step.selector));
    if (direct !== -1) return direct;
    return steps.findIndex((step) => step.roots?.some((selector) => closestInApp(target, selector)));
  }

  function pauseOnStep(index, fromClick) {
    const nextIndex = clamp(index, 0, steps.length - 1);
    if (nextIndex !== activeIndex) clearSelection(false);
    activeIndex = nextIndex;
    postBridgeConfig();
    paused = true;
    window.clearTimeout(timer);
    window.clearTimeout(exitTimer);
    layer.classList.remove("is-exiting");
    document.body.classList.add("guide-paused");
    applyForceShow(steps[activeIndex]);
    renderStep();
    updateControls();
    if (fromClick) {
      window.setTimeout(renderStep, 80);
      window.setTimeout(renderStep, 260);
    }
  }

  function resumeGuide() {
    if (editMode) setEditMode(false);
    paused = false;
    postBridgeConfig();
    document.body.classList.remove("guide-paused");
    clearForceShow();
    renderStep();
    scheduleNext();
    updateControls();
  }

  function setEditMode(on) {
    editMode = on;
    document.body.classList.toggle("guide-editing", editMode);
    if (!editMode) clearSelection(false);
    if (editMode && !paused) {
      pauseOnStep(activeIndex, false);
    }
    setEditableFields();
    updateControls();
    renderStep();
  }

  function resetCurrentStep() {
    recordHistory();
    delete saved.steps[steps[activeIndex].id];
    selectedDetail = null;
    selectedItems = [];
    writeSaved();
    renderStep();
    updateControls();
  }

  function renderStep() {
    if (drag) return;
    syncStageHeight();
    if (editMode) keepGuideVisibleWhileEditing();
    if (!appDoc && bridgeReady) {
      renderStepFromBridge();
      return;
    }
    if (!appDoc) return;

    const step = steps[activeIndex];
    const state = getStepState(step);
    applyForceShow(step);
    const target = findVisible(step.selector) || findFirst(step.selector) || appDoc.querySelector(".panel-shell");
    if (!target) return;

    applyTimingVars(step);
    applyFrameStyle(state);
    const targetRect = getStageRect(target);
    const focus = getFocus(step, state, targetRect);
    applyFocus(focus);

    const displayRect = getDisplayRect(target);
    const frameRect = normalizeRect(state.frame, paddedRect(displayRect, 10));
    applyFrameRect(frameRect);
    renderCard(step, state, frameRect);
    renderDetails(step, state, frameRect);
    renderTextOverlays(state);
    setEditableFields();
    updateSelectionUi();
    updateControls();
  }

  function renderStepFromBridge() {
    syncStageHeight();
    const renderId = ++latestBridgeRender;
    const step = steps[activeIndex];
    const state = getStepState(step);
    const selectors = getStepSelectors(step);
    requestBridgeMeasure(step, selectors).then((rects) => {
      if (renderId !== latestBridgeRender || drag || appDoc) return;
      if (editMode) keepGuideVisibleWhileEditing();

      const targetRect = bridgeStageRect(rects[step.selector] || rects[".panel-shell"]);
      if (!targetRect) return;

      applyTimingVars(step);
      applyFrameStyle(state);
      const focus = getFocus(step, state, targetRect);
      applyFocus(focus);

      const displayRect = displayRectFromStageRect(targetRect);
      const frameRect = normalizeRect(state.frame, paddedRect(displayRect, 10));
      applyFrameRect(frameRect);
      renderCard(step, state, frameRect);
      renderDetailsFromBridge(step, state, frameRect, rects);
      renderTextOverlays(state);
      setEditableFields();
      updateSelectionUi();
      updateControls();
    });
  }

  function renderDetailsFromBridge(step, state, frameRect, rects) {
    detailHost.replaceChildren();
    getRenderableDetails(step, state).forEach((detail, index) => {
      const detailState = getRenderableDetailState(step, state, detail);
      const el = document.createElement("div");
      el.className = "guide-detail";
      el.dataset.guideDrag = "detail";
      el.dataset.detailKind = detail.kind;
      el.dataset.detailIndex = String(detail.stateIndex);
      el.classList.toggle("is-selected", isSelectedItem({ type: "detail", detailKind: detail.kind, detailIndex: detail.stateIndex }));
      renderGuideCardContent(el, {
        number: detailState.number ?? detail.number ?? String(index + 1),
        emoji: detailState.emoji,
        title: detailState.title,
        text: detailState.text ?? detail.text,
        image: detailState.image
      });
      detailHost.appendChild(el);
      applyDetailTextStyle(el, state);
      appendBorderControls(el);
      el.appendChild(createDeleteHandle());

      const targetRect = detail.selector ? bridgeStageRect(rects[detail.selector]) : null;
      const displayRect = targetRect ? displayRectFromStageRect(targetRect) : frameRect;
      const fallback = defaultDetailPosition(frameRect, displayRect, index);
      const x = savedOrFallbackPosition(detailState.x, fallback.x, 12, STAGE_WIDTH - 305);
      const y = savedOrFallbackPosition(detailState.y, fallback.y, 12, STAGE_HEIGHT - 80);
      setBox(el, x, y);
      applyTiltToNode(el, detailState);
    });
  }

  function renderCard(step, state, frameRect) {
    applyTextStyle(state);
    layer.querySelector("[data-guide-progress]").textContent = `${activeIndex + 1}/${steps.length}`;
    if (state.card?.hidden) {
      card.hidden = true;
      return;
    }
    renderGuideCardContent(card, {
      number: state.card?.number,
      emoji: state.card?.emoji,
      title: state.title ?? step.title,
      text: state.copy ?? step.copy,
      image: state.card?.image
    });
    card.hidden = false;
    card.classList.toggle("is-selected", isSelectedItem({ type: "card" }));

    const fallback = defaultCardPosition(frameRect);
    const cardState = state.card || {};
    const x = savedOrFallbackPosition(cardState.x, fallback.x, 12, STAGE_WIDTH - 440);
    const y = savedOrFallbackPosition(cardState.y, fallback.y, 12, STAGE_HEIGHT - 120);
    if (Number.isFinite(cardState.width) && Number.isFinite(cardState.height)) {
      applyCardRect({ left: x, top: y, width: cardState.width, height: cardState.height });
    } else {
      setBox(card, x, y);
      applyCardSize(null);
    }
    applyTiltToNode(card, cardState);
  }

  function applyCardRect(rect) {
    setBox(card, rect.left, rect.top);
    applyCardSize(rect);
  }

  function applyCardSize(rect) {
    if (rect) {
      card.style.width = `${Math.round(rect.width)}px`;
      card.style.maxWidth = `${Math.round(rect.width)}px`;
      card.style.height = `${Math.round(rect.height)}px`;
    } else {
      card.style.width = "";
      card.style.maxWidth = "";
      card.style.height = "";
    }
  }

  function renderDetails(step, state, frameRect) {
    detailHost.replaceChildren();
    getRenderableDetails(step, state).forEach((detail, index) => {
      const detailState = getRenderableDetailState(step, state, detail);
      const el = document.createElement("div");
      el.className = "guide-detail";
      el.dataset.guideDrag = "detail";
      el.dataset.detailKind = detail.kind;
      el.dataset.detailIndex = String(detail.stateIndex);
      el.classList.toggle("is-selected", isSelectedItem({ type: "detail", detailKind: detail.kind, detailIndex: detail.stateIndex }));
      renderGuideCardContent(el, {
        number: detailState.number ?? detail.number ?? String(index + 1),
        emoji: detailState.emoji,
        title: detailState.title,
        text: detailState.text ?? detail.text,
        image: detailState.image
      });
      detailHost.appendChild(el);
      applyDetailTextStyle(el, state);
      appendBorderControls(el);
      el.appendChild(createDeleteHandle());

      const target = detail.selector ? (findVisible(detail.selector) || findFirst(detail.selector)) : null;
      const targetRect = target ? getDisplayRect(target) : frameRect;
      const fallback = defaultDetailPosition(frameRect, targetRect, index);
      const x = savedOrFallbackPosition(detailState.x, fallback.x, 12, STAGE_WIDTH - 305);
      const y = savedOrFallbackPosition(detailState.y, fallback.y, 12, STAGE_HEIGHT - 80);
      setBox(el, x, y);
      applyTiltToNode(el, detailState);
    });
  }

  function beginDrag(event) {
    if (!editMode) return;
    if (event.target.closest("[contenteditable='true']")) return;
    if (event.target.closest(".guide-align-menu")) return;

    const textControl = event.target.closest("[data-guide-text-control]");
    if (textControl) {
      beginTextControl(event, textControl);
      return;
    }

    const fontControl = event.target.closest("[data-guide-font-control]");
    if (fontControl) {
      beginFontControl(event, fontControl);
      return;
    }

    const tiltControl = event.target.closest("[data-guide-tilt-control]");
    if (tiltControl) {
      beginTiltControl(event, tiltControl);
      return;
    }

    const borderControl = event.target.closest("[data-guide-border-control]");
    if (borderControl) {
      beginBorderControl(event, borderControl);
      return;
    }

    const colorControl = event.target.closest("[data-guide-color-control]");
    if (colorControl) {
      beginColorControl(event, colorControl);
      return;
    }

    const deleteHandle = event.target.closest("[data-guide-delete-handle]");
    if (deleteHandle) {
      event.preventDefault();
      event.stopPropagation();
      const handleNode = deleteHandle.closest("[data-guide-drag]");
      if (handleNode) deleteElementByNode(handleNode);
      return;
    }

    const resize = event.target.closest("[data-guide-resize]");
    const node = resize ? resize.closest("[data-guide-drag]") : event.target.closest("[data-guide-drag]");
    if (!node) {
      beginMarquee(event);
      return;
    }
    const item = selectionItemFromNode(node);
    if (item) {
      if (event.shiftKey || !isSelectedItem(item)) {
        selectItem(item, event.shiftKey);
      } else {
        syncSelectedDetail();
        updateSelectionUi();
      }
    }
    recordHistory();

    event.preventDefault();
    event.stopPropagation();
    node.setPointerCapture?.(event.pointerId);
    document.body.classList.add("guide-dragging");

    drag = {
      type: node.dataset.guideDrag,
      resize: resize?.dataset.guideResize || "",
      detailKind: node.dataset.detailKind || "builtIn",
      detailIndex: Number(node.dataset.detailIndex),
      overlayIndex: Number(node.dataset.overlayIndex),
      startX: event.clientX,
      startY: event.clientY,
      rect: node.dataset.guideDrag === "focus" ? getCurrentFocus() : readNodeRect(node),
      overlay: node.dataset.guideDrag === "overlay" && Number.isFinite(Number(node.dataset.overlayIndex))
        ? normalizeTextOverlay(getTextOverlays(getStepState(steps[activeIndex]))[Number(node.dataset.overlayIndex)])
        : null,
      selectedLayouts: item && !resize && isSelectedItem(item) && selectedItems.length > 1 ? getSelectedLayoutItems() : [],
      node
    };
  }

  function moveDrag(event) {
    if (fontControlDrag) {
      moveFontControl(event);
      return;
    }
    if (textControlDrag) {
      moveTextControl(event);
      return;
    }
    if (tiltControlDrag) {
      moveTiltControl(event);
      return;
    }
    if (colorControlDrag) {
      moveColorControl(event);
      return;
    }
    if (borderControlDrag) {
      moveBorderControl(event);
      return;
    }
    if (!drag) return;
    if (drag.type === "marquee") {
      moveMarquee(event);
      return;
    }
    const scale = getCaptureZoom();
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    const state = getStepState(steps[activeIndex]);

    if (drag.type === "focus") {
      const next = clampFocus({
        scale: drag.rect.scale,
        x: drag.rect.x + dx,
        y: drag.rect.y + dy
      });
      state.focus = {
        ...(state.focus || {}),
        zoom: next.scale,
        x: next.x,
        y: next.y
      };
      applyFocus(next);
      saveSoon();
      return;
    }

    if (drag.selectedLayouts?.length > 1 && ["card", "detail", "frame", "overlay"].includes(drag.type)) {
      drag.selectedLayouts.forEach((layoutItem) => {
        setLayoutItemPosition(layoutItem, layoutItem.rect.left + dx, layoutItem.rect.top + dy);
      });
      saveSoon();
      return;
    }

    if (drag.type === "frame") {
      const next = drag.resize ? resizedRect(drag.rect, dx, dy, drag.resize) : {
        left: drag.rect.left + dx,
        top: drag.rect.top + dy,
        width: drag.rect.width,
        height: drag.rect.height
      };
      state.frame = plainRect(clampRect(next, 24, 24));
      applyFrameRect(state.frame);
      saveSoon();
      return;
    }

    if (drag.type === "card" && drag.resize) {
      const next = clampRect(resizedRect(drag.rect, dx, dy, drag.resize), 160, 60);
      state.card = {
        ...(state.card || {}),
        x: Math.round(next.left),
        y: Math.round(next.top),
        width: Math.round(next.width),
        height: Math.round(next.height)
      };
      applyCardRect(next);
      saveSoon();
      return;
    }

    if (drag.type === "overlay" && drag.resize && Number.isFinite(drag.overlayIndex)) {
      const overlay = getTextOverlays(state)[drag.overlayIndex];
      if (overlay) {
        const horizontal = drag.resize.includes("w") ? -dx : dx;
        const vertical = drag.resize.includes("n") ? -dy : dy;
        overlay.size = clamp(Math.round((drag.overlay?.size || DEFAULT_TEXT_OVERLAY.size) + (horizontal + vertical) / 3), 8, 400);
        const inner = drag.node.querySelector(".guide-text-overlay-text");
        applyOverlayStyle(drag.node, inner, normalizeTextOverlay(overlay));
        saveSoon();
      }
      return;
    }

    const x = clamp(drag.rect.left + dx, 12, STAGE_WIDTH - 48);
    const y = clamp(drag.rect.top + dy, 12, STAGE_HEIGHT - 48);
    if (drag.type === "card") {
      state.card = { ...(state.card || {}), x: Math.round(x), y: Math.round(y) };
      setBox(card, x, y);
      saveSoon();
      return;
    }

    if (drag.type === "detail" && Number.isFinite(drag.detailIndex)) {
      const detail = getDetailStateByKind(steps[activeIndex], drag.detailKind, drag.detailIndex);
      detail.x = Math.round(x);
      detail.y = Math.round(y);
      setBox(drag.node, x, y);
      saveSoon();
      return;
    }

    if (drag.type === "overlay" && Number.isFinite(drag.overlayIndex)) {
      const overlay = getTextOverlays(state)[drag.overlayIndex];
      if (overlay) {
        overlay.x = Math.round(x);
        overlay.y = Math.round(y);
        setBox(drag.node, x, y);
        saveSoon();
      }
    }
  }

  function endDrag() {
    if (fontControlDrag) {
      endFontControl();
      return;
    }
    if (textControlDrag) {
      endTextControl();
      return;
    }
    if (tiltControlDrag) {
      endTiltControl();
      return;
    }
    if (colorControlDrag) {
      endColorControl();
      return;
    }
    if (borderControlDrag) {
      endBorderControl();
      return;
    }
    if (!drag) return;
    const wasMarquee = drag.type === "marquee";
    const shouldRender = drag.type === "focus";
    drag = null;
    document.body.classList.remove("guide-dragging");
    if (marquee) marquee.hidden = true;
    if (wasMarquee) {
      updateSelectionUi();
      updateControls();
      return;
    }
    writeSaved();
    if (shouldRender) renderStep();
    updateSelectionUi();
    updateControls();
  }

  function saveTextEdit(event) {
    if (!editMode) return;
    recordHistory();
    const step = steps[activeIndex];
    const state = getStepState(step);
    const field = event.target.closest("[data-guide-card-field]");
    if (!field) return;

    const item = selectionItemFromNode(field.closest("[data-guide-drag]"));
    const key = field.dataset.guideCardField;
    const value = cleanText(field.innerText);
    if (item?.type === "card") {
      if (key === "title") state.title = value;
      if (key === "text") state.copy = value;
      if (key === "number" || key === "emoji") {
        state.card ||= {};
        state.card[key] = value;
      }
      if (key === "title") updateStepOptions();
    } else if (item?.type === "detail") {
      const detailState = getDetailStateByKind(step, item.detailKind, item.detailIndex);
      detailState[key] = value;
    }
    saveSoon();
  }

  function saveEditorValues() {
    if (!editMode) return;
    keepGuideVisibleWhileEditing();
    recordHistory(false);
    const state = getStepState(steps[activeIndex]);
    const appSize = normalizeAppSize({
      width: numberValue(controls.appWidth),
      height: numberValue(controls.appHeight)
    });
    saved.app = appSize;
    applyAppSize(appSize);
    saved.background = normalizeBackground({
      color: stringValue(controls.bgColor, DEFAULT_BACKGROUND.color),
      accent: stringValue(controls.bgAccent, DEFAULT_BACKGROUND.accent),
      x: numberValue(controls.bgX, DEFAULT_BACKGROUND.x),
      y: numberValue(controls.bgY, DEFAULT_BACKGROUND.y),
      spread: numberValue(controls.bgSpread, DEFAULT_BACKGROUND.spread),
      layers: saveBackgroundLayerControls(getBackground().layers)
    });
    applyBackground(saved.background);
    const previousFocus = getFocus(steps[activeIndex], state);
    const nextFocus = resizeFocusAroundCenter(previousFocus, numberValue(controls.focusZoom));
    const currentStyle = getFrameStyle(state);
    state.timing = {
      appear: numberValue(controls.appear),
      stay: numberValue(controls.stay),
      disappear: numberValue(controls.disappear)
    };
    state.focus = {
      ...(state.focus || {}),
      zoom: nextFocus.scale,
      x: nextFocus.x,
      y: nextFocus.y
    };
    state.style = {
      titleColor: stringValue(controls.titleColor, DEFAULT_FRAME_STYLE.titleColor),
      titleSize: numberValue(controls.titleSize, DEFAULT_FRAME_STYLE.titleSize),
      copyColor: stringValue(controls.copyColor, DEFAULT_FRAME_STYLE.copyColor),
      copySize: numberValue(controls.copySize, DEFAULT_FRAME_STYLE.copySize),
      numberColor: stringValue(controls.numberColor, DEFAULT_FRAME_STYLE.numberColor),
      numberBg: stringValue(controls.numberBg, DEFAULT_FRAME_STYLE.numberBg),
      cardBorderWidth: numberValue(controls.cardBorderWidth, DEFAULT_FRAME_STYLE.cardBorderWidth),
      cardBorderColor: stringValue(controls.cardBorderColor, DEFAULT_FRAME_STYLE.cardBorderColor),
      cardBorderOpacity: currentStyle.cardBorderOpacity,
      cardRadius: numberValue(controls.cardRadius, DEFAULT_FRAME_STYLE.cardRadius),
      cardBg: stringValue(controls.cardBg, DEFAULT_FRAME_STYLE.cardBg),
      color: stringValue(controls.frameColor, DEFAULT_FRAME_STYLE.color),
      width: numberValue(controls.frameWidth, DEFAULT_FRAME_STYLE.width),
      borderOpacity: currentStyle.borderOpacity,
      radius: numberValue(controls.frameRadius, DEFAULT_FRAME_STYLE.radius),
      glowColor: stringValue(controls.glowColor, DEFAULT_FRAME_STYLE.glowColor),
      glowSpread: numberValue(controls.glowSpread, DEFAULT_FRAME_STYLE.glowSpread),
      glowIntensity: numberValue(controls.glowIntensity, DEFAULT_FRAME_STYLE.glowIntensity),
      outerColor: stringValue(controls.outerColor, DEFAULT_FRAME_STYLE.outerColor),
      outerWidth: numberValue(controls.outerWidth, DEFAULT_FRAME_STYLE.outerWidth),
      outerRadius: numberValue(controls.outerRadius, DEFAULT_FRAME_STYLE.outerRadius),
      outerGap: numberValue(controls.outerGap, DEFAULT_FRAME_STYLE.outerGap)
    };
    applyCheckedGlobalSettings(state);
    writeSaved();
    renderStep();
    keepGuideVisibleWhileEditing();
  }

  function keepGuideVisibleWhileEditing() {
    window.clearTimeout(timer);
    window.clearTimeout(exitTimer);
    paused = true;
    layer.hidden = false;
    layer.classList.remove("is-exiting");
    document.body.classList.add("guide-paused");
  }

  function applyCheckedGlobalSettings(sourceState) {
    const paths = controls.applyAll
      .filter((input) => input.checked)
      .map((input) => input.dataset.guideApplyAll)
      .filter(Boolean);
    if (!paths.length) return;

    steps.forEach((step) => {
      const targetState = getStepState(step);
      paths.forEach((path) => {
        const value = getStatePath(sourceState, path);
        if (value !== undefined) setStatePath(targetState, path, value);
      });
    });
  }

  function getStatePath(state, path) {
    return path.split(".").reduce((current, key) => current?.[key], state);
  }

  function setStatePath(state, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((current, key) => {
      current[key] ||= {};
      return current[key];
    }, state);
    target[last] = value;
  }

  function addManualBox() {
    recordHistory();
    const step = steps[activeIndex];
    const state = getStepState(step);
    state.manualDetails ||= [];
    state.manualDetails.push({
      number: "",
      title: "",
      text: "New card",
      emoji: "",
      image: "",
      x: getBaseAppLeft() + APP_WIDTH + 44,
      y: 96 + state.manualDetails.length * 64
    });
    selectedDetail = { kind: "manual", index: state.manualDetails.length - 1 };
    selectedItems = [{ type: "detail", detailKind: "manual", detailIndex: state.manualDetails.length - 1 }];
    writeSaved();
    renderStep();
  }

  function addFieldToSelectedCard(field) {
    if (!editMode) return;
    if (field === "image") {
      const target = selectedImageTargetItem();
      if (!target) selectedItems = [{ type: "card" }];
      imageInput?.click();
      updateSelectionUi();
      updateControls();
      return;
    }
    if (selectedItems.length !== 1) return;
    const item = selectedItems[0];
    if (item.type !== "card" && item.type !== "detail") return;

    recordHistory();
    const step = steps[activeIndex];
    const state = getStepState(step);
    const target = item.type === "card"
      ? (state.card ||= {})
      : getDetailStateByKind(step, item.detailKind, item.detailIndex);

    if (field === "title" && item.type === "card") {
      state.title ||= "Title";
    } else if (field === "title") {
      target.title ||= "Title";
    } else if (field === "number") {
      target.number ||= String(getRenderableDetails(step, state).length + 1);
    } else if (field === "emoji") {
      target.emoji ||= "✨";
    }

    writeSaved();
    renderStep();
    updateControls();
  }

  function handleImageDrag(event) {
    if (!editMode || !hasImageFile(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (imageDrop) {
      imageDrop.hidden = false;
      imageDrop.classList.add("is-active");
    }
  }

  function handleImageDragLeave(event) {
    if (!imageDrop || layer.contains(event.relatedTarget)) return;
    hideImageDrop();
  }

  function handleImageDrop(event) {
    if (!editMode || !hasImageFile(event.dataTransfer)) return;
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files || []).find((item) => item.type.startsWith("image/"));
    hideImageDrop();
    if (!file) return;
    const targetItem = imageTargetItemFromPoint(event) || selectedImageTargetItem();
    if (!targetItem) return;
    attachImageFileToSelection(file, targetItem);
  }

  function hideImageDrop() {
    if (!imageDrop) return;
    imageDrop.hidden = true;
    imageDrop.classList.remove("is-active");
  }

  function hasImageFile(dataTransfer) {
    return Array.from(dataTransfer?.items || []).some((item) => item.kind === "file" && item.type.startsWith("image/"));
  }

  async function attachImageFileToSelection(file, item = selectedImageTargetItem()) {
    if (!item) return;
    const dataUrl = await readFileAsDataUrl(file);
    recordHistory();
    const step = steps[activeIndex];
    const state = getStepState(step);
    const target = item.type === "card"
      ? (state.card ||= {})
      : getDetailStateByKind(step, item.detailKind, item.detailIndex);
    target.image = dataUrl;
    writeSaved();
    renderStep();
    updateControls();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result || "")), { once: true });
      reader.addEventListener("error", () => reject(reader.error), { once: true });
      reader.readAsDataURL(file);
    });
  }

  function selectedImageTargetItem() {
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      if (item.type === "card" || item.type === "detail") return item;
    }
    return { type: "card" };
  }

  function selectedCardOrDetailItem() {
    if (selectedItems.length !== 1) return null;
    const item = selectedItems[0];
    return (item.type === "card" || item.type === "detail") ? item : null;
  }

  function getImageTargetForItem(item) {
    if (!item) return null;
    const step = steps[activeIndex];
    const state = getStepState(step);
    return item.type === "card"
      ? (state.card ||= {})
      : getDetailStateByKind(step, item.detailKind, item.detailIndex);
  }

  function selectedItemHasImage() {
    const target = getImageTargetForItem(selectedCardOrDetailItem());
    return Boolean(target?.image);
  }

  function removeImageFromSelectedCard() {
    if (!editMode) return;
    const target = getImageTargetForItem(selectedCardOrDetailItem());
    if (!target?.image) return;
    recordHistory();
    delete target.image;
    writeSaved();
    renderStep();
    updateControls();
  }

  function imageTargetItemFromPoint(event) {
    const node = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".guide-card, .guide-detail");
    if (!node) return null;
    return selectionItemFromNode(node);
  }

  function createDeleteHandle() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "guide-delete-handle";
    button.dataset.guideDeleteHandle = "true";
    button.setAttribute("aria-label", "Delete element");
    return button;
  }

  function appendBorderControls(node) {
    node.appendChild(createBorderControl("width"));
    node.appendChild(createBorderControl("opacity"));
    node.appendChild(createBorderControl("radius"));
    if (node.classList.contains("guide-card") || node.classList.contains("guide-detail")) {
      node.appendChild(createColorControl());
      node.appendChild(createTiltControl());
    }
  }

  function createBorderControl(kind) {
    const control = document.createElement("span");
    control.className = `guide-border-control is-${kind}`;
    control.dataset.guideBorderControl = kind;
    control.setAttribute("role", "slider");
    control.setAttribute("tabindex", "0");
    control.setAttribute("aria-label", borderControlLabel(kind));
    ensureBorderControlPopout(control);
    bindFloatingControlHandles(control);
    return control;
  }

  function borderControlLabel(kind) {
    if (kind === "width") return "Border thickness";
    if (kind === "opacity") return "Border transparency";
    return "Border radius";
  }

  function ensureBorderControlPopout(control) {
    if (control.querySelector(".guide-border-popout")) return;
    control.insertAdjacentHTML("beforeend", `
      <span class="guide-border-popout" aria-hidden="true">
        <span class="guide-border-rail"><span class="guide-border-fill"></span></span>
        <span class="guide-border-value"></span>
      </span>
    `);
  }

  function createColorControl() {
    const control = document.createElement("span");
    control.className = "guide-color-control";
    control.dataset.guideColorControl = "text";
    control.setAttribute("role", "button");
    control.setAttribute("tabindex", "0");
    control.setAttribute("aria-label", "Text color");
    ensureColorControlPopout(control);
    bindFloatingControlHandles(control);
    return control;
  }

  function createTiltControl() {
    const control = document.createElement("span");
    control.className = "guide-tilt-control";
    control.dataset.guideTiltControl = "true";
    control.setAttribute("aria-label", "3D perspective control");
    bindFloatingControlHandles(control);
    return control;
  }

  function appendTextOverlayControls(node) {
    node.appendChild(createColorControl());
    node.appendChild(createFontControl());
    ["size", "shadow", "curveX", "curveY"].forEach((kind) => node.appendChild(createTextControl(kind)));
    ["nw", "ne", "sw", "se"].forEach((corner) => {
      const resize = document.createElement("span");
      resize.className = `guide-resize is-${corner}`;
      resize.dataset.guideResize = corner;
      node.appendChild(resize);
    });
  }

  function createTextControl(kind) {
    const control = document.createElement("span");
    control.className = `guide-text-control is-${kind.toLowerCase()}`;
    control.dataset.guideTextControl = kind;
    control.setAttribute("role", "slider");
    control.setAttribute("tabindex", "0");
    control.setAttribute("aria-label", textControlLabel(kind));
    control.insertAdjacentHTML("beforeend", `
      <span class="guide-text-popout" aria-hidden="true">
        <span class="guide-text-rail"><span class="guide-text-fill"></span></span>
        <span class="guide-text-value"></span>
      </span>
    `);
    bindFloatingControlHandles(control);
    return control;
  }

  function createFontControl() {
    const control = document.createElement("span");
    control.className = "guide-font-control";
    control.dataset.guideFontControl = "true";
    control.setAttribute("role", "button");
    control.setAttribute("tabindex", "0");
    control.setAttribute("aria-label", "Font");
    control.insertAdjacentHTML("beforeend", `
      <span class="guide-font-popout" aria-hidden="true"></span>
    `);
    bindFloatingControlHandles(control);
    return control;
  }

  function textControlLabel(kind) {
    if (kind === "size") return "Text size";
    if (kind === "shadow") return "Text shadow";
    if (kind === "curveX") return "Curve X";
    return "Curve Y";
  }

  function bindFloatingControlHandles(root) {
    const findControls = (selector) => [
      ...(root.matches?.(selector) ? [root] : []),
      ...Array.from(root.querySelectorAll?.(selector) || [])
    ];
    findControls("[data-guide-border-control]").forEach((control) => {
      if (control.dataset.guideControlBound) return;
      control.dataset.guideControlBound = "true";
      control.addEventListener("pointerdown", (event) => beginBorderControl(event, control));
    });
    findControls("[data-guide-color-control]").forEach((control) => {
      if (control.dataset.guideControlBound) return;
      control.dataset.guideControlBound = "true";
      control.addEventListener("pointerdown", (event) => beginColorControl(event, control));
    });
    findControls("[data-guide-tilt-control]").forEach((control) => {
      if (control.dataset.guideControlBound) return;
      control.dataset.guideControlBound = "true";
      control.addEventListener("pointerdown", (event) => beginTiltControl(event, control));
    });
    findControls("[data-guide-text-control]").forEach((control) => {
      if (control.dataset.guideControlBound) return;
      control.dataset.guideControlBound = "true";
      control.addEventListener("pointerdown", (event) => beginTextControl(event, control));
    });
    findControls("[data-guide-font-control]").forEach((control) => {
      if (control.dataset.guideControlBound) return;
      control.dataset.guideControlBound = "true";
      control.addEventListener("pointerdown", (event) => beginFontControl(event, control));
    });
  }

  function ensureColorControlPopout(control) {
    if (control.querySelector(".guide-color-popout")) return;
    control.insertAdjacentHTML("beforeend", `
      <span class="guide-color-popout" aria-hidden="true">
        <span class="guide-color-picker"><span class="guide-color-picker-dot"></span></span>
      </span>
    `);
  }

  function beginBorderControl(event, handle) {
    const node = handle.closest("[data-guide-drag]");
    const item = selectionItemFromNode(node);
    if (!isBorderStyledItem(item)) return;
    colorTargets.set(itemKey(item), { kind: "border" });
    event.preventDefault();
    event.stopPropagation();
    selectItem(item, false);
    recordHistory(false);
    const kind = handle.dataset.guideBorderControl;
    borderControlDrag = {
      handle,
      item,
      kind,
      startX: event.clientX,
      startValue: getBorderControlValue(item, kind)
    };
    handle.classList.add("is-dragging");
    handle.setPointerCapture?.(event.pointerId);
    updateBorderControlHandle(handle, item);
  }

  function beginColorControl(event, handle) {
    const node = handle.closest("[data-guide-drag]");
    const item = selectionItemFromNode(node);
    if (!isCardTextStyledItem(item)) return;
    event.preventDefault();
    event.stopPropagation();
    selectItem(item, false);
    recordHistory(false);
    ensureColorControlPopout(handle);
    colorControlDrag = { handle, item, latestColor: getTextColorControlValue() };
    handle.classList.add("is-dragging");
    handle.setPointerCapture?.(event.pointerId);
    moveColorControl(event);
  }

  function beginTextControl(event, handle) {
    const node = handle.closest("[data-guide-drag]");
    const item = selectionItemFromNode(node);
    if (item?.type !== "overlay") return;
    const overlay = getTextOverlays(getStepState(steps[activeIndex]))[item.overlayIndex];
    if (!overlay) return;
    event.preventDefault();
    event.stopPropagation();
    selectItem(item, false);
    recordHistory(false);
    textControlDrag = {
      handle,
      item,
      kind: handle.dataset.guideTextControl,
      startX: event.clientX,
      startValue: textControlValue(normalizeTextOverlay(overlay), handle.dataset.guideTextControl)
    };
    handle.classList.add("is-dragging");
    handle.setPointerCapture?.(event.pointerId);
    updateTextControlHandle(handle, normalizeTextOverlay(overlay));
  }

  function beginFontControl(event, handle) {
    const node = handle.closest("[data-guide-drag]");
    const item = selectionItemFromNode(node);
    if (item?.type !== "overlay") return;
    const overlay = getTextOverlays(getStepState(steps[activeIndex]))[item.overlayIndex];
    if (!overlay) return;
    event.preventDefault();
    event.stopPropagation();
    selectItem(item, false);
    recordHistory(false);
    fontControlDrag = {
      handle,
      item,
      startY: event.clientY,
      startIndex: Math.max(0, TEXT_OVERLAY_FONT_VALUES.indexOf(normalizeTextOverlay(overlay).font))
    };
    handle.classList.add("is-dragging");
    updateFontControlHandle(handle, normalizeTextOverlay(overlay));
    handle.setPointerCapture?.(event.pointerId);
  }

  function beginTiltControl(event, handle) {
    const node = handle.closest("[data-guide-drag]");
    const item = selectionItemFromNode(node);
    if (!isTiltStyledItem(item)) return;
    event.preventDefault();
    event.stopPropagation();
    selectItem(item, false);
    recordHistory(false);
    const tilt = getTiltForItem(item);
    tiltControlDrag = {
      handle,
      item,
      node,
      startX: event.clientX,
      startY: event.clientY,
      tiltX: tilt.tiltX,
      tiltY: tilt.tiltY
    };
    handle.classList.add("is-dragging");
    handle.setPointerCapture?.(event.pointerId);
  }

  function moveColorControl(event) {
    const active = colorControlDrag;
    if (!active) return;
    event.preventDefault();
    const picker = active.handle.querySelector(".guide-color-picker");
    if (!picker) return;
    const rect = picker.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const color = colorFromPickerPoint(x, y);
    active.latestColor = color;
    active.handle.style.setProperty("--guide-color-picker-x", `${x * 100}%`);
    active.handle.style.setProperty("--guide-color-picker-y", `${y * 100}%`);
    active.handle.style.setProperty("--guide-color-current", color);
    setTextColorControlValue(color);
    saveSoon();
  }

  function endColorControl() {
    if (!colorControlDrag) return;
    colorControlDrag.handle.classList.remove("is-dragging");
    colorControlDrag = null;
    writeSaved();
    updateControls();
  }

  function moveTextControl(event) {
    const active = textControlDrag;
    if (!active) return;
    event.preventDefault();
    const overlay = getTextOverlays(getStepState(steps[activeIndex]))[active.item.overlayIndex];
    if (!overlay) return;
    const dx = (event.clientX - active.startX) / getCaptureZoom();
    setTextControlValue(overlay, active.kind, active.startValue + dx / textControlScale(active.kind));
    const normalized = normalizeTextOverlay(overlay);
    applyOverlayStyle(active.handle.closest("[data-guide-drag]"), active.handle.closest("[data-guide-drag]")?.querySelector(".guide-text-overlay-text"), normalized);
    updateTextControlHandle(active.handle, normalized);
    saveSoon();
  }

  function endTextControl() {
    if (!textControlDrag) return;
    textControlDrag.handle.classList.remove("is-dragging");
    textControlDrag = null;
    writeSaved();
    updateControls();
  }

  function moveFontControl(event) {
    const active = fontControlDrag;
    if (!active) return;
    event.preventDefault();
    const overlay = getTextOverlays(getStepState(steps[activeIndex]))[active.item.overlayIndex];
    if (!overlay) return;
    const dy = (event.clientY - active.startY) / getCaptureZoom();
    const index = clamp(active.startIndex + Math.round(dy / 18), 0, TEXT_OVERLAY_FONT_VALUES.length - 1);
    overlay.font = TEXT_OVERLAY_FONT_VALUES[index];
    const normalized = normalizeTextOverlay(overlay);
    applyOverlayStyle(active.handle.closest("[data-guide-drag]"), active.handle.closest("[data-guide-drag]")?.querySelector(".guide-text-overlay-text"), normalized);
    updateFontControlHandle(active.handle, normalized);
    saveSoon();
  }

  function endFontControl() {
    if (!fontControlDrag) return;
    fontControlDrag.handle.classList.remove("is-dragging");
    fontControlDrag = null;
    writeSaved();
    updateControls();
  }

  function moveTiltControl(event) {
    const active = tiltControlDrag;
    if (!active) return;
    event.preventDefault();
    const zoom = getCaptureZoom();
    const dx = (event.clientX - active.startX) / zoom;
    const dy = (event.clientY - active.startY) / zoom;
    const tiltX = clamp(Math.round((active.tiltX - dy / 3) * 10) / 10, -80, 80);
    const tiltY = clamp(Math.round((active.tiltY + dx / 3) * 10) / 10, -80, 80);
    setTiltForItem(active.item, tiltX, tiltY);
    applyTiltToNode(active.node, { tiltX, tiltY });
    saveSoon();
  }

  function endTiltControl() {
    if (!tiltControlDrag) return;
    tiltControlDrag.handle.classList.remove("is-dragging");
    tiltControlDrag = null;
    writeSaved();
    updateControls();
  }

  function moveBorderControl(event) {
    const active = borderControlDrag;
    if (!active) return;
    event.preventDefault();
    const dx = (event.clientX - active.startX) / getCaptureZoom();
    const scale = active.kind === "opacity" ? 150 : 4;
    setBorderControlValue(active.item, active.kind, active.startValue + dx / scale);
    updateBorderControlHandle(active.handle, active.item);
    saveSoon();
  }

  function endBorderControl() {
    if (!borderControlDrag) return;
    borderControlDrag.handle.classList.remove("is-dragging");
    borderControlDrag = null;
    writeSaved();
    updateControls();
  }

  function isBorderStyledItem(item) {
    return item?.type === "frame" || item?.type === "card" || item?.type === "detail";
  }

  function isCardTextStyledItem(item) {
    return item?.type === "card" || item?.type === "detail" || item?.type === "overlay";
  }

  function isTiltStyledItem(item) {
    return item?.type === "card" || item?.type === "detail" || item?.type === "overlay";
  }

  function getTiltForItem(item) {
    const target = getTiltTargetForItem(item);
    return {
      tiltX: finiteNumber(target?.tiltX, 0),
      tiltY: finiteNumber(target?.tiltY, 0)
    };
  }

  function setTiltForItem(item, tiltX, tiltY) {
    const target = getTiltTargetForItem(item);
    if (!target) return;
    target.tiltX = tiltX;
    target.tiltY = tiltY;
  }

  function getTiltTargetForItem(item) {
    if (!item) return null;
    const step = steps[activeIndex];
    const state = getStepState(step);
    if (item.type === "card") return (state.card ||= {});
    if (item.type === "detail") return getDetailStateByKind(step, item.detailKind, item.detailIndex);
    if (item.type === "overlay") return getTextOverlays(state)[item.overlayIndex] || null;
    return null;
  }

  function getTextColorControlValue() {
    const target = getActiveColorTarget();
    if (target.item?.type === "overlay") {
      const overlay = getTextOverlays(getStepState(steps[activeIndex]))[target.item.overlayIndex];
      return normalizeTextOverlay(overlay).color;
    }
    const style = getFrameStyle(getStepState(steps[activeIndex]));
    if (target.kind === "title") return style.titleColor;
    if (target.kind === "border") return target.item?.type === "frame" ? style.color : style.cardBorderColor;
    if (target.kind === "background") return style.cardBg;
    if (target.kind === "numberText") return style.numberColor;
    if (target.kind === "numberBg") return style.numberBg;
    return style.copyColor;
  }

  function setTextColorControlValue(color) {
    const state = getStepState(steps[activeIndex]);
    state.style ||= {};
    const target = getActiveColorTarget();
    if (target.item?.type === "overlay") {
      const overlay = getTextOverlays(state)[target.item.overlayIndex];
      if (!overlay) return;
      overlay.color = color;
      const node = overlayHost?.querySelector(`[data-overlay-index="${target.item.overlayIndex}"]`);
      if (node) applyOverlayStyle(node, node.querySelector(".guide-text-overlay-text"), normalizeTextOverlay(overlay));
      return;
    }
    if (target.kind === "title") {
      state.style.titleColor = color;
    } else if (target.kind === "border") {
      if (target.item?.type === "frame") state.style.color = color;
      else state.style.cardBorderColor = color;
    } else if (target.kind === "background") {
      state.style.cardBg = color;
    } else if (target.kind === "numberText") {
      state.style.numberColor = color;
    } else if (target.kind === "numberBg") {
      state.style.numberBg = color;
    } else {
      state.style.copyColor = color;
    }
    const style = getFrameStyle(state);
    applyFrameStyle(state);
    card?.style.setProperty("--guide-title-color", style.titleColor);
    card?.style.setProperty("--guide-copy-color", style.copyColor);
    card?.style.setProperty("--guide-number-color", style.numberColor);
    card?.style.setProperty("--guide-number-bg", style.numberBg);
    card && applyCardBoxStyle(card, style);
    detailHost?.querySelectorAll(".guide-detail").forEach((node) => {
      node.style.setProperty("--guide-title-color", style.titleColor);
      node.style.setProperty("--guide-copy-color", style.copyColor);
      node.style.setProperty("--guide-number-color", style.numberColor);
      node.style.setProperty("--guide-number-bg", style.numberBg);
      applyCardBoxStyle(node, style);
    });
  }

  function rememberColorTargetFromEvent(event) {
    if (!editMode) return;
    const control = event.target.closest("[data-guide-color-control]");
    if (control) return;
    const node = event.target.closest("[data-guide-drag]");
    const item = selectionItemFromNode(node);
    if (!item) return;
    const target = colorTargetFromEvent(event, node, item);
    if (target) {
      lastColorTarget = { ...target, item };
      colorTargets.set(itemKey(item), target);
    }
  }

  function getActiveColorTarget() {
    const item = selectedItems.length === 1 ? selectedItems[0] : null;
    const stored = colorTargets.get(itemKey(item));
    if (stored) return { ...stored, item };
    if (lastColorTarget) return lastColorTarget;
    if (item?.type === "frame") return { item, kind: "border" };
    return { item, kind: "copy" };
  }

  function colorTargetFromEvent(event, node, item) {
    if (item.type === "overlay") return { kind: "overlayText" };
    if (event.target.closest("[data-guide-border-control]")) return { kind: "border" };
    if (event.target.closest("[data-guide-tilt-control]")) return colorTargets.get(itemKey(item)) || { kind: "copy" };
    const field = event.target.closest("[data-guide-card-field]");
    if (field) {
      const key = field.dataset.guideCardField;
      if (key === "title") return { kind: "title" };
      if (key === "text" || key === "emoji") return { kind: "copy" };
      if (key === "number") return { kind: event.altKey || event.shiftKey ? "numberText" : "numberBg" };
    }
    if (item.type === "frame") return { kind: "border" };
    if (isNearElementBorder(event, node)) return { kind: "border" };
    return { kind: "background" };
  }

  function isNearElementBorder(event, node) {
    const rect = node.getBoundingClientRect();
    const edge = Math.max(10, Math.min(rect.width, rect.height) * 0.08);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return x <= edge || y <= edge || rect.width - x <= edge || rect.height - y <= edge;
  }

  function textControlValue(overlay, kind) {
    if (kind === "size") return overlay.size;
    if (kind === "shadow") return overlay.shadow;
    if (kind === "curveX") return overlay.curveX;
    return overlay.curveY;
  }

  function setTextControlValue(overlay, kind, rawValue) {
    if (kind === "size") overlay.size = clamp(Math.round(rawValue), 8, 400);
    else if (kind === "shadow") overlay.shadow = clamp(Math.round(rawValue), 0, 100);
    else if (kind === "curveX") overlay.curveX = clamp(Math.round(rawValue), -80, 80);
    else overlay.curveY = clamp(Math.round(rawValue), -80, 80);
  }

  function textControlScale(kind) {
    return kind === "size" ? 2.5 : kind === "shadow" ? 2 : 1.8;
  }

  function updateTextControlHandle(handle, overlay) {
    const kind = handle.dataset.guideTextControl;
    const value = textControlValue(overlay, kind);
    const min = kind === "curveX" || kind === "curveY" ? -80 : 0;
    const max = kind === "size" ? 400 : kind === "shadow" ? 100 : 80;
    const percent = ((value - min) / (max - min)) * 100;
    handle.style.setProperty("--guide-text-value", `${clamp(percent, 0, 100)}%`);
    handle.setAttribute("aria-valuemin", String(min));
    handle.setAttribute("aria-valuemax", String(max));
    handle.setAttribute("aria-valuenow", String(value));
    const label = handle.querySelector(".guide-text-value");
    if (label) label.textContent = kind === "size" ? `${value}px` : String(value);
  }

  function updateFontControlHandle(handle, overlay) {
    const popout = handle.querySelector(".guide-font-popout");
    const active = TEXT_OVERLAY_FONTS.find((font) => font.value === overlay.font) || TEXT_OVERLAY_FONTS[0];
    handle.style.setProperty("--guide-font-name", `"${active.label}"`);
    if (popout) {
      popout.textContent = active.label;
      popout.style.fontFamily = overlay.font || "";
    }
  }

  function colorFromPickerPoint(x, y) {
    const hue = x * 360;
    const lightness = 100 - y * 100;
    const saturation = 96;
    return hslToHex(hue, saturation, lightness);
  }

  function hslToHex(hue, saturation, lightness) {
    saturation /= 100;
    lightness /= 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const segment = hue / 60;
    const x = chroma * (1 - Math.abs((segment % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    if (segment >= 0 && segment < 1) [r, g, b] = [chroma, x, 0];
    else if (segment < 2) [r, g, b] = [x, chroma, 0];
    else if (segment < 3) [r, g, b] = [0, chroma, x];
    else if (segment < 4) [r, g, b] = [0, x, chroma];
    else if (segment < 5) [r, g, b] = [x, 0, chroma];
    else [r, g, b] = [chroma, 0, x];
    const match = lightness - chroma / 2;
    return `#${[r, g, b].map((channel) => {
      const value = Math.round((channel + match) * 255);
      return value.toString(16).padStart(2, "0");
    }).join("")}`;
  }

  function getBorderControlValue(item, kind) {
    const style = getFrameStyle(getStepState(steps[activeIndex]));
    if (item?.type === "frame") {
      if (kind === "width") return style.width;
      if (kind === "opacity") return style.borderOpacity;
      return style.radius;
    }
    if (kind === "width") return style.cardBorderWidth;
    if (kind === "opacity") return style.cardBorderOpacity;
    return style.cardRadius;
  }

  function setBorderControlValue(item, kind, rawValue) {
    const state = getStepState(steps[activeIndex]);
    state.style ||= {};
    if (item?.type === "frame") {
      if (kind === "width") state.style.width = snapBorderWidth(rawValue);
      if (kind === "opacity") state.style.borderOpacity = snapBorderOpacity(rawValue);
      if (kind === "radius") state.style.radius = snapBorderRadius(rawValue);
      applyFrameStyle(state);
      return;
    }
    if (kind === "width") state.style.cardBorderWidth = snapBorderWidth(rawValue);
    if (kind === "opacity") state.style.cardBorderOpacity = snapBorderOpacity(rawValue);
    if (kind === "radius") state.style.cardRadius = snapBorderRadius(rawValue);
    const style = getFrameStyle(state);
    card && applyCardBoxStyle(card, style);
    detailHost?.querySelectorAll(".guide-detail").forEach((node) => applyCardBoxStyle(node, style));
  }

  function snapBorderWidth(value) {
    return clamp(Math.round(finiteNumber(value, 0) * 2) / 2, 0, 20);
  }

  function snapBorderOpacity(value) {
    return clamp(Math.round(finiteNumber(value, 1) * 100) / 100, 0, 1);
  }

  function snapBorderRadius(value) {
    return clamp(Math.round(finiteNumber(value, 0)), 0, 80);
  }

  function updateBorderControlHandles() {
    layer?.querySelectorAll("[data-guide-border-control]").forEach((handle) => {
      const item = selectionItemFromNode(handle.closest("[data-guide-drag]"));
      updateBorderControlHandle(handle, item);
    });
  }

  function updateColorControlHandles() {
    const color = getTextColorControlValue();
    layer?.querySelectorAll("[data-guide-color-control]").forEach((handle) => {
      ensureColorControlPopout(handle);
      handle.style.setProperty("--guide-color-current", color);
    });
  }

  function updateTextOverlayControlHandles() {
    overlayHost?.querySelectorAll(".guide-text-overlay").forEach((node) => {
      const overlay = normalizeTextOverlay(getTextOverlays(getStepState(steps[activeIndex]))[Number(node.dataset.overlayIndex)]);
      node.querySelectorAll("[data-guide-text-control]").forEach((handle) => updateTextControlHandle(handle, overlay));
      node.querySelectorAll("[data-guide-font-control]").forEach((handle) => updateFontControlHandle(handle, overlay));
    });
  }

  function updateBorderControlHandle(handle, item) {
    ensureBorderControlPopout(handle);
    const kind = handle.dataset.guideBorderControl;
    const value = getBorderControlValue(item, kind);
    const max = kind === "width" ? 20 : kind === "opacity" ? 1 : 80;
    const percent = max > 0 ? (value / max) * 100 : 0;
    handle.style.setProperty("--guide-border-value", `${clamp(percent, 0, 100)}%`);
    handle.setAttribute("aria-valuemin", "0");
    handle.setAttribute("aria-valuemax", String(max));
    handle.setAttribute("aria-valuenow", String(value));
    const label = handle.querySelector(".guide-border-value");
    if (label) label.textContent = kind === "opacity" ? `${Math.round(value * 100)}%` : `${value}px`;
  }

  function deleteElementByNode(node) {
    const item = selectionItemFromNode(node);
    if (!item || !isDeletableItem(item)) return;
    selectedItems = [item];
    deleteSelectedBox();
  }

  function deleteSelectedBox() {
    const deletable = selectedItems.filter(isDeletableItem);
    if (!deletable.length) return;
    recordHistory();
    const state = getStepState(steps[activeIndex]);

    if (deletable.some((item) => item.type === "card")) {
      state.card ||= {};
      state.card.hidden = true;
    }

    const manualIndexes = deletable
      .filter((item) => item.type === "detail" && item.detailKind === "manual")
      .map((item) => item.detailIndex)
      .filter(Number.isFinite)
      .sort((a, b) => b - a);
    if (manualIndexes.length) {
      state.manualDetails ||= [];
      [...new Set(manualIndexes)].forEach((index) => {
        state.manualDetails.splice(index, 1);
      });
    }

    const builtInIndexes = deletable
      .filter((item) => item.type === "detail" && item.detailKind !== "manual")
      .map((item) => item.detailIndex)
      .filter(Number.isFinite);
    if (builtInIndexes.length) {
      state.hiddenDetails ||= [];
      builtInIndexes.forEach((index) => {
        if (!state.hiddenDetails.includes(index)) state.hiddenDetails.push(index);
      });
    }
    renumberVisibleDetails(steps[activeIndex], state);

    const overlayIndexes = deletable
      .filter((item) => item.type === "overlay")
      .map((item) => item.overlayIndex)
      .filter(Number.isFinite)
      .sort((a, b) => b - a);
    if (overlayIndexes.length) {
      const overlays = getTextOverlays(state);
      [...new Set(overlayIndexes)].forEach((index) => overlays.splice(index, 1));
      activeTextOverlay = clamp(activeTextOverlay, 0, Math.max(0, overlays.length - 1));
    }

    if (deletable.some((item) => item.type === "frame")) {
      delete state.frame;
      const style = getFrameStyle(state);
      state.style = {
        ...(state.style || {}),
        width: 0,
        outerWidth: 0,
        glowIntensity: 0,
        glowSpread: style.glowSpread
      };
    }
    selectedDetail = null;
    selectedItems = [];
    writeSaved();
    renderStep();
    updateControls();
  }

  function setEditableFields() {
    const value = editMode ? "true" : "false";
    layer.querySelectorAll("[data-guide-card-field]:not(img)").forEach((node) => {
      node.setAttribute("contenteditable", value);
    });
  }

  function updateControls() {
    if (controls.play) {
      controls.play.textContent = paused ? "Play" : "Pause";
      controls.play.setAttribute("aria-label", paused ? "Play guide" : "Pause guide");
      controls.play.setAttribute("aria-pressed", paused ? "false" : "true");
    }
    if (controls.edit) controls.edit.textContent = editMode ? "Done" : "Edit";
    controls.edit?.classList.toggle("is-active", editMode);
    if (controls.reset) controls.reset.hidden = !editMode;
    if (controls.editor) controls.editor.hidden = !editMode;
    if (controls.deleteStep) controls.deleteStep.disabled = !editMode || steps.length <= 1;
    updateStepOptions();
    if (controls.step) controls.step.value = String(activeIndex);

    const state = getStepState(steps[activeIndex]);
    const timing = getTiming(steps[activeIndex]);
    setInput(controls.appear, timing.appear);
    setInput(controls.stay, timing.stay);
    setInput(controls.disappear, timing.disappear);
    const focus = getFocus(steps[activeIndex], state);
    setInput(controls.focusZoom, focus.scale);
    const appSize = getAppSize();
    setInput(controls.appWidth, appSize.width);
    setInput(controls.appHeight, appSize.height);
    const background = getBackground();
    setInput(controls.bgColor, background.color);
    setInput(controls.bgAccent, background.accent);
    setInput(controls.bgX, background.x);
    setInput(controls.bgY, background.y);
    setInput(controls.bgSpread, background.spread);
    updateBackgroundLayerControls(background);
    const style = getFrameStyle(state);
    setInput(controls.titleColor, style.titleColor);
    setInput(controls.titleSize, style.titleSize);
    setInput(controls.copyColor, style.copyColor);
    setInput(controls.copySize, style.copySize);
    setInput(controls.numberColor, style.numberColor);
    setInput(controls.numberBg, style.numberBg);
    setInput(controls.cardBorderWidth, style.cardBorderWidth);
    setInput(controls.cardBorderColor, style.cardBorderColor);
    setInput(controls.cardRadius, style.cardRadius);
    setInput(controls.cardBg, style.cardBg);
    setInput(controls.frameColor, style.color);
    setInput(controls.frameWidth, style.width);
    setInput(controls.frameRadius, style.radius);
    setInput(controls.glowColor, style.glowColor);
    setInput(controls.glowSpread, style.glowSpread);
    setInput(controls.glowIntensity, style.glowIntensity);
    setInput(controls.outerColor, style.outerColor);
    setInput(controls.outerWidth, style.outerWidth);
    setInput(controls.outerRadius, style.outerRadius);
    setInput(controls.outerGap, style.outerGap);
    if (controls.deleteBox) controls.deleteBox.disabled = !selectedItems.some(isDeletableItem);
    if (controls.removeImage) controls.removeImage.disabled = !(editMode && selectedItemHasImage());
    controls.addFields.forEach((button) => {
      const selected = selectedItems.length === 1 ? selectedItems[0] : null;
      const isCardTarget = selected && (selected.type === "card" || selected.type === "detail");
      button.disabled = button.dataset.guideAddField === "image" ? !editMode : !(editMode && isCardTarget);
    });
    updateOverlayControls();
    if (controls.undo) controls.undo.disabled = undoStack.length === 0;
    if (controls.redo) controls.redo.disabled = redoStack.length === 0;
  }

  function getStageRect(target) {
    const rect = target.getBoundingClientRect();
    return {
      left: getBaseAppLeft() + rect.left,
      top: getBaseAppTop() + rect.top,
      width: rect.width,
      height: rect.height,
      right: getBaseAppLeft() + rect.right,
      bottom: getBaseAppTop() + rect.bottom
    };
  }

  function getDisplayRect(target) {
    const rect = getStageRect(target);
    return displayRectFromStageRect(rect);
  }

  function displayRectFromStageRect(rect) {
    const focus = getCurrentFocus();
    return {
      left: getBaseAppLeft() + focus.x + (rect.left - getBaseAppLeft()) * focus.scale,
      top: getBaseAppTop() + focus.y + (rect.top - getBaseAppTop()) * focus.scale,
      width: rect.width * focus.scale,
      height: rect.height * focus.scale,
      right: getBaseAppLeft() + focus.x + (rect.right - getBaseAppLeft()) * focus.scale,
      bottom: getBaseAppTop() + focus.y + (rect.bottom - getBaseAppTop()) * focus.scale
    };
  }

  function getStepSelectors(step) {
    return [
      ".panel-shell",
      step.selector,
      ...(step.roots || []),
      ...getRenderableDetails(step, getStepState(step)).map((detail) => detail.selector)
    ].filter(Boolean);
  }

  function requestBridgeMeasure(step, selectors) {
    const requestId = ++measureRequestId;
    postBridgeConfig();
    frame?.contentWindow?.postMessage({
      type: "SPACECAST_GUIDE_MEASURE",
      requestId,
      activeIndex,
      forceShow: step.forceShow || "",
      selectors
    }, "*");

    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        pendingMeasures.delete(requestId);
        resolve({});
      }, 500);
      pendingMeasures.set(requestId, (rects) => {
        window.clearTimeout(timeout);
        resolve(rects);
      });
    });
  }

  function bridgeStageRect(rect) {
    if (!rect) return null;
    return {
      left: getBaseAppLeft() + rect.left,
      top: getBaseAppTop() + rect.top,
      width: rect.width,
      height: rect.height,
      right: getBaseAppLeft() + rect.right,
      bottom: getBaseAppTop() + rect.bottom
    };
  }

  function getFocus(step, state) {
    const scale = clamp(Number(state.focus?.zoom ?? step.focusZoom ?? 1.22), 1, 5);
    const defaultX = Math.round((APP_WIDTH - APP_WIDTH * scale) / 2);
    const defaultY = Math.round((APP_HEIGHT - APP_HEIGHT * scale) / 2);
    return {
      scale,
      x: Math.round(finiteNumber(state.focus?.x, defaultX)),
      y: Math.round(finiteNumber(state.focus?.y, defaultY))
    };
  }

  function applyFocus(focus) {
    const next = clampFocus(focus);
    appLayer.dataset.focusScale = String(next.scale);
    appLayer.dataset.focusX = String(next.x);
    appLayer.dataset.focusY = String(next.y);
    appLayer.style.left = `${Math.round(getBaseAppLeft())}px`;
    appLayer.style.top = `${Math.round(getBaseAppTop())}px`;
    appLayer.style.zoom = "";
    appLayer.style.transform = `matrix(${next.scale}, 0, 0, ${next.scale}, ${next.x}, ${next.y})`;
    applyFocusDragRect(next);
  }

  function getCurrentFocus() {
    return {
      scale: Number(appLayer.dataset.focusScale || 1),
      x: Number(appLayer.dataset.focusX || 0),
      y: Number(appLayer.dataset.focusY || 0)
    };
  }

  function resizeFocusAroundCenter(focus, scale) {
    const nextScale = clamp(Number(scale || focus.scale || 1), 1, 5);
    const centerX = getBaseAppLeft() + focus.x + APP_WIDTH * focus.scale / 2;
    const centerY = getBaseAppTop() + focus.y + APP_HEIGHT * focus.scale / 2;
    return clampFocus({
      scale: nextScale,
      x: centerX - getBaseAppLeft() - APP_WIDTH * nextScale / 2,
      y: centerY - getBaseAppTop() - APP_HEIGHT * nextScale / 2
    });
  }

  function clampFocus(focus) {
    const scale = clamp(Number(focus.scale || 1), 1, 5);
    const minVisible = 80;
    const minX = minVisible - getBaseAppLeft() - APP_WIDTH * scale;
    const maxX = STAGE_WIDTH - minVisible - getBaseAppLeft();
    const minY = minVisible - getBaseAppTop() - APP_HEIGHT * scale;
    const maxY = STAGE_HEIGHT - minVisible - getBaseAppTop();
    return {
      scale,
      x: Math.round(clamp(Number(focus.x || 0), minX, maxX)),
      y: Math.round(clamp(Number(focus.y || 0), minY, maxY))
    };
  }

  function applyFocusDragRect(focus) {
    if (!focusDrag) return;
    const left = getBaseAppLeft() + focus.x + APP_WIDTH * focus.scale / 2 - 12;
    const top = getBaseAppTop() + focus.y + APP_HEIGHT * focus.scale / 2 - 12;
    focusDrag.style.left = `${Math.round(left)}px`;
    focusDrag.style.top = `${Math.round(top)}px`;
  }

  function defaultCardPosition(frameRect) {
    const appRect = getFocusedAppRect();
    const right = appRect.right;
    const left = appRect.left;
    if (right + 44 + 420 < STAGE_WIDTH) {
      return { x: right + 44, y: clamp(frameRect.top - 8, 42, STAGE_HEIGHT - 220) };
    }
    return { x: Math.max(32, left - 464), y: clamp(frameRect.top - 8, 42, STAGE_HEIGHT - 220) };
  }

  function defaultDetailPosition(frameRect, targetRect, index) {
    const appRect = getFocusedAppRect();
    const left = appRect.left;
    const right = appRect.right;
    const preferLeft = left - 325 > 18;
    return {
      x: preferLeft ? left - 325 : right + 28,
      y: clamp(Math.min(frameRect.top, targetRect.top) + index * 72, 28, STAGE_HEIGHT - 86)
    };
  }

  function savedOrFallbackPosition(savedValue, fallbackValue, min, max) {
    const savedNumber = Number(savedValue);
    if (Number.isFinite(savedNumber)) return savedNumber;
    return clamp(Number(fallbackValue), min, max);
  }

  function syncStageHeight() {
    const desktop = document.querySelector(".capture-desktop");
    const nextHeight = Math.max(BASE_STAGE_HEIGHT, Math.round(desktop?.clientHeight || BASE_STAGE_HEIGHT));
    if (nextHeight !== STAGE_HEIGHT) STAGE_HEIGHT = nextHeight;
  }

  function findFirst(selector) {
    return appDoc?.querySelector(selector) || null;
  }

  function findVisible(selector) {
    if (!appDoc) return null;
    return [...appDoc.querySelectorAll(selector)].find((node) => {
      const rect = node.getBoundingClientRect();
      const style = appDoc.defaultView.getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    }) || null;
  }

  function closestInApp(target, selector) {
    return target?.closest?.(selector) || null;
  }

  function isInsideStep(target, step) {
    if (closestInApp(target, step.selector)) return true;
    if (step.roots?.some((selector) => closestInApp(target, selector))) return true;
    return step.details?.some((detail) => closestInApp(target, detail.selector));
  }

  function isInsideVisibleMenu(target) {
    return OPEN_MENU_SELECTORS.some((selector) => {
      const node = closestInApp(target, selector);
      if (!node) return false;
      if (node.hidden) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  function applyForceShow(step) {
    clearForceShow();
    if (!step.forceShow || !appDoc) return;
    forcedElement = appDoc.querySelector(step.forceShow);
    if (forcedElement) {
      forcedElement.dataset.guidePreviousDisplay = forcedElement.style.display || "";
      forcedElement.style.display = "grid";
    }
  }

  function clearForceShow() {
    if (bridgeReady) {
      frame?.contentWindow?.postMessage({ type: "SPACECAST_GUIDE_CLEAR_FORCE" }, "*");
    }
    if (!forcedElement) return;
    forcedElement.style.display = forcedElement.dataset.guidePreviousDisplay || "";
    delete forcedElement.dataset.guidePreviousDisplay;
    forcedElement = null;
  }

  function applyTimingVars(step) {
    const timing = getTiming(step);
    layer.style.setProperty("--guide-appear-ms", `${Math.round(timing.appear * 1000)}ms`);
    layer.style.setProperty("--guide-disappear-ms", `${Math.round(timing.disappear * 1000)}ms`);
  }

  function getTiming(step) {
    const state = getStepState(step);
    return {
      appear: Number(state.timing?.appear ?? DEFAULT_TIMING.appear),
      stay: Number(state.timing?.stay ?? DEFAULT_TIMING.stay),
      disappear: Number(state.timing?.disappear ?? DEFAULT_TIMING.disappear)
    };
  }

  function getDuration(timing) {
    return Number(timing.appear + timing.stay + timing.disappear);
  }

  function getStepState(step) {
    saved.steps[step.id] ||= {};
    return saved.steps[step.id];
  }

  function loadCustomSteps() {
    const existing = new Set(steps.map((step) => step.id));
    saved.customSteps.forEach((step) => {
      if (!step?.id || existing.has(step.id)) return;
      steps.push(normalizeCustomStep(step));
      existing.add(step.id);
    });
    applySavedStepOrder();
  }

  function addStep() {
    if (!editMode) return;
    recordHistory();
    const step = createCustomStep();
    saved.customSteps.push(step);
    const insertIndex = activeIndex + 1;
    steps.splice(insertIndex, 0, step);
    activeIndex = insertIndex;
    saved.steps[step.id] = {
      title: step.title,
      copy: step.copy,
      card: {
        x: getBaseAppLeft() + APP_WIDTH + 44,
        y: 96
      }
    };
    saveStepOrder();
    clearSelection(false);
    writeSaved();
    updateStepOptions();
    pauseOnStep(activeIndex, false);
  }

  function deleteStep() {
    if (!editMode || steps.length <= 1) return;
    recordHistory();
    const step = steps[activeIndex];
    const deletedIndex = activeIndex;
    steps.splice(deletedIndex, 1);
    saved.customSteps = saved.customSteps.filter((customStep) => customStep.id !== step.id);
    if (!step.custom && !saved.deletedSteps.includes(step.id)) {
      saved.deletedSteps.push(step.id);
    }
    delete saved.steps[step.id];
    activeIndex = clamp(deletedIndex, 0, steps.length - 1);
    saveStepOrder();
    clearSelection(false);
    writeSaved();
    updateStepOptions();
    pauseOnStep(activeIndex, false);
  }

  function moveStep(delta) {
    if (!steps.length) return;
    const next = clamp(activeIndex + delta, 0, steps.length - 1);
    if (next === activeIndex) return;
    clearSelection(false);
    pauseOnStep(next, false);
  }

  function createCustomStep() {
    const id = uniqueStepId();
    return {
      id,
      custom: true,
      title: `New step ${activeIndex + 2}`,
      selector: ".panel-shell",
      copy: "New step text.",
      details: []
    };
  }

  function uniqueStepId() {
    const used = new Set(steps.map((step) => step.id));
    let index = saved.customSteps.length + 1;
    let id = `custom-${Date.now().toString(36)}-${index}`;
    while (used.has(id)) {
      index += 1;
      id = `custom-${Date.now().toString(36)}-${index}`;
    }
    return id;
  }

  function normalizeCustomStep(step) {
    return {
      id: String(step.id),
      custom: true,
      title: String(step.title || "New step"),
      selector: String(step.selector || ".panel-shell"),
      copy: String(step.copy || "New step text."),
      details: Array.isArray(step.details) ? step.details : []
    };
  }

  function updateStepOptions() {
    if (!controls.step) return;
    const options = steps.map((step, index) => {
      const label = getStepLabel(step);
      return `<option value="${index}">${index + 1}. ${escapeHtml(label)}</option>`;
    }).join("");
    if (controls.step.innerHTML !== options) controls.step.innerHTML = options;
  }

  function getStepLabel(step) {
    return getStepState(step).title || step.title || "Untitled step";
  }

  function applySavedStepOrder() {
    if (saved.deletedSteps.length) {
      const deleted = new Set(saved.deletedSteps);
      for (let index = steps.length - 1; index >= 0; index -= 1) {
        if (deleted.has(steps[index].id)) steps.splice(index, 1);
      }
    }
    if (!saved.stepOrder.length) {
      saveStepOrder();
      return;
    }
    const byId = new Map(steps.map((step) => [step.id, step]));
    const ordered = saved.stepOrder.map((id) => byId.get(id)).filter(Boolean);
    const orderedIds = new Set(ordered.map((step) => step.id));
    steps.forEach((step) => {
      if (!orderedIds.has(step.id)) ordered.push(step);
    });
    steps.splice(0, steps.length, ...ordered);
    saveStepOrder();
  }

  function saveStepOrder() {
    saved.stepOrder = steps.map((step) => step.id);
  }

  function getDetailState(step, index) {
    const state = getStepState(step);
    state.details ||= [];
    state.details[index] ||= {};
    return state.details[index];
  }

  function getDetailStateByKind(step, kind, index) {
    const state = getStepState(step);
    if (kind === "manual") {
      state.manualDetails ||= [];
      state.manualDetails[index] ||= {};
      return state.manualDetails[index];
    }
    return getDetailState(step, index);
  }

  function getRenderableDetails(step, state) {
    const hidden = new Set(state.hiddenDetails || []);
    const builtIn = step.details.map((detail, index) => ({
      ...detail,
      kind: "builtIn",
      stateIndex: index
    })).filter((detail) => !hidden.has(detail.stateIndex));
    const manual = (state.manualDetails || []).map((detail, index) => ({
      ...detail,
      selector: "",
      kind: "manual",
      stateIndex: index
    }));
    return [...builtIn, ...manual];
  }

  function getRenderableDetailState(step, state, detail) {
    if (detail.kind === "manual") {
      state.manualDetails ||= [];
      state.manualDetails[detail.stateIndex] ||= {};
      return state.manualDetails[detail.stateIndex];
    }
    state.details ||= [];
    state.details[detail.stateIndex] ||= {};
    return state.details[detail.stateIndex];
  }

  function renumberVisibleDetails(step, state) {
    let nextNumber = 1;
    getRenderableDetails(step, state).forEach((detail) => {
      const detailState = getRenderableDetailState(step, state, detail);
      const currentNumber = detailState.number ?? detail.number;
      if (!hasValue(currentNumber)) return;
      detailState.number = String(nextNumber);
      nextNumber += 1;
    });
  }

  function normalizeSaved(value) {
    if (!value || typeof value !== "object") return { steps: {} };
    if (!value.steps || typeof value.steps !== "object") value.steps = {};
    value.app = normalizeAppSize(value.app || {});
    value.background = normalizeBackground(value.background || {});
    value.customSteps = Array.isArray(value.customSteps) ? value.customSteps.map(normalizeCustomStep) : [];
    value.stepOrder = Array.isArray(value.stepOrder) ? value.stepOrder.map(String) : [];
    value.deletedSteps = Array.isArray(value.deletedSteps) ? value.deletedSteps.map(String) : [];
    return value;
  }

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveSoon() {
    window.clearTimeout(saveSoon.timer);
    saveSoon.timer = window.setTimeout(writeSaved, 80);
  }

  function writeSaved() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (_) {}
  }

  function addBackgroundLayer() {
    if (!editMode) return;
    recordHistory();
    const background = getBackground();
    const seed = Date.now() % 100000;
    background.layers.push(normalizeBackgroundLayer({ ...DEFAULT_BACKGROUND_LAYER, seed }));
    activeBackgroundLayer = background.layers.length - 1;
    saved.background = background;
    applyBackground(background);
    writeSaved();
    updateControls();
  }

  function deleteBackgroundLayer() {
    if (!editMode) return;
    const background = getBackground();
    if (!background.layers.length) return;
    recordHistory();
    background.layers.splice(activeBackgroundLayer, 1);
    activeBackgroundLayer = clamp(activeBackgroundLayer, 0, Math.max(0, background.layers.length - 1));
    saved.background = background;
    applyBackground(background);
    writeSaved();
    updateControls();
  }

  function saveBackgroundLayerControls(layers) {
    const nextLayers = layers.map((item) => ({ ...item }));
    const current = nextLayers[activeBackgroundLayer];
    if (!current) return nextLayers;
    current.type = stringValue(controls.bgLayer, current.type);
    current.colorA = stringValue(controls.bgLayerColorA, current.colorA);
    current.colorB = stringValue(controls.bgLayerColorB, current.colorB);
    current.x = numberValue(controls.bgLayerX, current.x);
    current.y = numberValue(controls.bgLayerY, current.y);
    current.width = numberValue(controls.bgLayerWidth, current.width);
    current.height = numberValue(controls.bgLayerHeight, current.height);
    current.rotate = numberValue(controls.bgLayerRotate, current.rotate);
    current.opacity = numberValue(controls.bgLayerOpacity, current.opacity);
    current.hardness = numberValue(controls.bgLayerHardness, current.hardness);
    current.blur = numberValue(controls.bgLayerBlur, current.blur);
    current.count = numberValue(controls.bgLayerCount, current.count);
    current.sizeMin = numberValue(controls.bgLayerSizeMin, current.sizeMin);
    current.sizeMax = numberValue(controls.bgLayerSizeMax, current.sizeMax);
    return nextLayers.map(normalizeBackgroundLayer);
  }

  function updateBackgroundLayerControls(background) {
    const layers = background.layers || [];
    activeBackgroundLayer = clamp(activeBackgroundLayer, 0, Math.max(0, layers.length - 1));
    if (controls.bgLayer) {
      const currentLayer = layers[activeBackgroundLayer] || DEFAULT_BACKGROUND_LAYER;
      const options = backgroundLayerTypeOptions(currentLayer.type);
      const empty = '<option value="0">No layers</option>';
      controls.bgLayer.innerHTML = options || empty;
      controls.bgLayer.value = currentLayer.type;
      controls.bgLayer.disabled = !editMode || !layers.length;
    }
    if (controls.bgAddLayer) controls.bgAddLayer.disabled = !editMode;
    if (controls.bgDeleteLayer) controls.bgDeleteLayer.disabled = !editMode || !layers.length;

    const current = layers[activeBackgroundLayer] || normalizeBackgroundLayer(DEFAULT_BACKGROUND_LAYER);
        setInput(controls.bgLayerColorA, current.colorA);
    setInput(controls.bgLayerColorB, current.colorB);
    setInput(controls.bgLayerX, current.x);
    setInput(controls.bgLayerY, current.y);
    setInput(controls.bgLayerWidth, current.width);
    setInput(controls.bgLayerHeight, current.height);
    setInput(controls.bgLayerRotate, current.rotate);
    setInput(controls.bgLayerOpacity, current.opacity);
    setInput(controls.bgLayerHardness, current.hardness);
    setInput(controls.bgLayerBlur, current.blur);
    setInput(controls.bgLayerCount, current.count);
    setInput(controls.bgLayerSizeMinRange, current.sizeMin);
    setInput(controls.bgLayerSizeMaxRange, current.sizeMax);
    updateBackgroundRangeFill();
    setInput(controls.bgLayerSizeMin, current.sizeMin);
    setInput(controls.bgLayerSizeMax, current.sizeMax);

    [
      controls.bgLayerType,
      controls.bgLayerColorA,
      controls.bgLayerColorB,
      controls.bgLayerX,
      controls.bgLayerY,
      controls.bgLayerWidth,
      controls.bgLayerHeight,
      controls.bgLayerRotate,
      controls.bgLayerOpacity,
      controls.bgLayerHardness,
      controls.bgLayerBlur,
      controls.bgLayerCount,
      controls.bgLayerSizeMinRange,
      controls.bgLayerSizeMaxRange,
      controls.bgLayerSizeMin,
      controls.bgLayerSizeMax
    ].forEach((input) => {
      if (input) input.disabled = !editMode || !layers.length;
    });
  }

  function bindBackgroundRangeDrag() {
    const stack = document.querySelector(".guide-bg-range-stack");
    if (!stack || stack.dataset.rangeDragReady === "true") return;
    stack.dataset.rangeDragReady = "true";
    let activeInput = null;

    stack.addEventListener("pointerdown", (event) => {
      if (!editMode || controls.bgLayerSizeMinRange?.disabled) return;
      activeInput = nearestBackgroundRangeInput(event);
      if (!activeInput) return;
      event.preventDefault();
      stack.setPointerCapture?.(event.pointerId);
      setBackgroundRangeFromPointer(event, activeInput);
    });

    stack.addEventListener("pointermove", (event) => {
      if (!activeInput) return;
      event.preventDefault();
      setBackgroundRangeFromPointer(event, activeInput);
    });

    const stopDrag = (event) => {
      if (!activeInput) return;
      stack.releasePointerCapture?.(event.pointerId);
      activeInput = null;
    };
    stack.addEventListener("pointerup", stopDrag);
    stack.addEventListener("pointercancel", stopDrag);
  }

  function nearestBackgroundRangeInput(event) {
    const minInput = controls.bgLayerSizeMinRange;
    const maxInput = controls.bgLayerSizeMaxRange;
    if (!minInput || !maxInput) return null;
    const value = backgroundRangePointerValue(event);
    const min = numberValue(minInput, DEFAULT_BACKGROUND_LAYER.sizeMin);
    const max = numberValue(maxInput, DEFAULT_BACKGROUND_LAYER.sizeMax);
    return Math.abs(value - min) <= Math.abs(value - max) ? minInput : maxInput;
  }

  function setBackgroundRangeFromPointer(event, input) {
    let value = backgroundRangePointerValue(event);
    const minInput = controls.bgLayerSizeMinRange;
    const maxInput = controls.bgLayerSizeMaxRange;
    if (input === minInput) value = Math.min(value, numberValue(maxInput, DEFAULT_BACKGROUND_LAYER.sizeMax));
    if (input === maxInput) value = Math.max(value, numberValue(minInput, DEFAULT_BACKGROUND_LAYER.sizeMin));
    input.value = String(value);
    syncBackgroundSizeRange({ target: input });
  }

  function updateBackgroundRangeFill() {
    const stack = document.querySelector(".guide-bg-range-stack");
    const minInput = controls.bgLayerSizeMinRange;
    const maxInput = controls.bgLayerSizeMaxRange;
    if (!stack || !minInput || !maxInput) return;
    const min = clamp(numberValue(minInput, DEFAULT_BACKGROUND_LAYER.sizeMin), 1, 240);
    const max = clamp(numberValue(maxInput, DEFAULT_BACKGROUND_LAYER.sizeMax), min, 240);
    const start = ((min - 1) / 239) * 100;
    const end = ((max - 1) / 239) * 100;
    stack.style.setProperty("--range-start", `${start}%`);
    stack.style.setProperty("--range-end", `${end}%`);
  }
  function backgroundRangePointerValue(event) {
    const stack = document.querySelector(".guide-bg-range-stack");
    const rect = stack?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return DEFAULT_BACKGROUND_LAYER.sizeMin;
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    return Math.round(1 + ratio * 239);
  }

  function syncBackgroundSizeRange(event) {
    if (!editMode) return;
    let min = Math.round(numberValue(controls.bgLayerSizeMinRange, DEFAULT_BACKGROUND_LAYER.sizeMin));
    let max = Math.round(numberValue(controls.bgLayerSizeMaxRange, DEFAULT_BACKGROUND_LAYER.sizeMax));
    if (event.target === controls.bgLayerSizeMinRange && min > max) max = min;
    if (event.target === controls.bgLayerSizeMaxRange && max < min) min = max;
    if (controls.bgLayerSizeMinRange) controls.bgLayerSizeMinRange.value = String(min);
    if (controls.bgLayerSizeMaxRange) controls.bgLayerSizeMaxRange.value = String(max);
    if (controls.bgLayerSizeMin) controls.bgLayerSizeMin.value = String(min);
    if (controls.bgLayerSizeMax) controls.bgLayerSizeMax.value = String(max);
    updateBackgroundRangeFill();
    saveEditorValues();
  }
  function backgroundLayerTypeOptions(activeType) {
    const labels = { blob: "Blurb", ellipse: "Ellipse", rectangle: "Rectangle", diamond: "Diamond", particles: "Particles" };
    return Object.entries(labels)
      .map(([value, label]) => `<option value="${value}"${value === activeType ? " selected" : ""}>${label}</option>`)
      .join("");
  }
  function backgroundLayerLabel(layer) {
    const labels = { blob: "Blurb", ellipse: "Ellipse", rectangle: "Rectangle", diamond: "Diamond", particles: "Particles" };
    return labels[layer.type] || "Layer";
  }

  function handleStorageUpdate(event) {
    if (event.key !== STORAGE_KEY || !OUTPUT_MODE) return;
    window.clearTimeout(handleStorageUpdate.timer);
    handleStorageUpdate.timer = window.setTimeout(() => window.location.reload(), 180);
  }

  function openOutputWindow() {
    const url = new URL(window.location.href);
    url.searchParams.set("output", "1");
    url.searchParams.delete("render");
    window.open(url.href, "spacecast-guide-output", "popup,width=1920,height=1080");
  }

  function downloadRenderData() {
    writeSaved();
    const payload = {
      version: 1,
      storageKey: STORAGE_KEY,
      createdAt: new Date().toISOString(),
      state: normalizeSaved(JSON.parse(JSON.stringify(saved)))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expert-maker-overlay-render-data.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function renderVideoFromUi() {
    const renderSize = getRenderSize();
    writeSaved();
    setExportStatus(`Rendering ${renderSize.width}x${renderSize.height} MP4...`);
    if (controls.renderVideo) controls.renderVideo.disabled = true;

    try {
      const response = await fetch("/api/export-video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          state: normalizeSaved(JSON.parse(JSON.stringify(saved))),
          width: renderSize.width,
          height: renderSize.height
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Export Studio is not running.");
      }
      setExportStatus(`Saved: ${result.output}`);
    } catch (error) {
      setExportStatus(location.protocol === "file:"
        ? "Open Export Studio first."
        : String(error.message || error));
    } finally {
      if (controls.renderVideo) controls.renderVideo.disabled = false;
    }
  }

  function applyRenderPreset() {
    const value = controls.renderPreset?.value || "1920x1080";
    if (value === "custom") return;
    const [width, height] = value.split("x").map((part) => Number(part));
    if (controls.renderWidth) controls.renderWidth.value = String(width);
    if (controls.renderHeight) controls.renderHeight.value = String(height);
  }

  function markCustomRenderPreset() {
    if (controls.renderPreset) controls.renderPreset.value = "custom";
  }

  function getRenderSize() {
    return {
      width: clamp(Math.round(numberValue(controls.renderWidth, 1920)), 640, 7680),
      height: clamp(Math.round(numberValue(controls.renderHeight, 1080)), 360, 4320)
    };
  }

  function setExportStatus(message) {
    if (!controls.exportStatus) return;
    controls.exportStatus.hidden = false;
    controls.exportStatus.textContent = message;
  }

  function restartForExport() {
    activeIndex = 0;
    paused = false;
    editMode = false;
    clearSelection(false);
    document.body.classList.remove("guide-editing", "guide-paused");
    layer.classList.remove("is-exiting");
    postBridgeConfig();
    renderStep();
    scheduleNext();
    updateControls();
  }

  function getExportTimeline() {
    return steps.map((step, index) => {
      const timing = getTiming(step);
      return {
        index,
        id: step.id,
        title: getStepLabel(step),
        seconds: getDuration(timing),
        timing
      };
    });
  }

  function getAppSize() {
    return normalizeAppSize(saved.app || {});
  }

  function getBackground() {
    return normalizeBackground(saved.background || {});
  }

  function normalizeBackground(value) {
    return {
      color: normalizeColor(value.color, DEFAULT_BACKGROUND.color),
      accent: normalizeColor(value.accent, DEFAULT_BACKGROUND.accent),
      x: clamp(Math.round(finiteNumber(value.x, DEFAULT_BACKGROUND.x)), 0, 100),
      y: clamp(Math.round(finiteNumber(value.y, DEFAULT_BACKGROUND.y)), 0, 100),
      spread: clamp(Math.round(finiteNumber(value.spread, DEFAULT_BACKGROUND.spread)), 8, 120),
      layers: Array.isArray(value.layers) ? value.layers.slice(0, 16).map(normalizeBackgroundLayer) : []
    };
  }

  function normalizeBackgroundLayer(value) {
    value = value && typeof value === "object" ? value : {};
    const type = ["blob", "ellipse", "rectangle", "diamond", "particles"].includes(value.type) ? value.type : DEFAULT_BACKGROUND_LAYER.type;
    const sizeMin = clamp(Math.round(finiteNumber(value.sizeMin, DEFAULT_BACKGROUND_LAYER.sizeMin)), 1, 180);
    const sizeMax = clamp(Math.round(finiteNumber(value.sizeMax, DEFAULT_BACKGROUND_LAYER.sizeMax)), sizeMin, 240);
    return {
      type,
      colorA: normalizeColor(value.colorA, DEFAULT_BACKGROUND_LAYER.colorA),
      colorB: normalizeColor(value.colorB, DEFAULT_BACKGROUND_LAYER.colorB),
      x: clamp(Math.round(finiteNumber(value.x, DEFAULT_BACKGROUND_LAYER.x)), 0, 100),
      y: clamp(Math.round(finiteNumber(value.y, DEFAULT_BACKGROUND_LAYER.y)), 0, 100),
      width: clamp(Math.round(finiteNumber(value.width, DEFAULT_BACKGROUND_LAYER.width)), 20, 200),
      height: clamp(Math.round(finiteNumber(value.height, DEFAULT_BACKGROUND_LAYER.height)), 20, 200),
      rotate: clamp(Math.round(finiteNumber(value.rotate, DEFAULT_BACKGROUND_LAYER.rotate)), -180, 180),
      opacity: clamp(finiteNumber(value.opacity, DEFAULT_BACKGROUND_LAYER.opacity), 0, 1),
      hardness: clamp(Math.round(finiteNumber(value.hardness, DEFAULT_BACKGROUND_LAYER.hardness)), 0, 100),
      blur: clamp(Math.round(finiteNumber(value.blur, DEFAULT_BACKGROUND_LAYER.blur)), 0, 160),
      count: clamp(Math.round(finiteNumber(value.count, DEFAULT_BACKGROUND_LAYER.count)), 1, 160),
      sizeMin,
      sizeMax,
      seed: Math.round(finiteNumber(value.seed, DEFAULT_BACKGROUND_LAYER.seed))
    };
  }

  function applyBackground(background) {
    const rgb = hexToRgb(background.accent).join(", ");
    document.documentElement.style.setProperty("--capture-bg-base", background.color);
    document.documentElement.style.setProperty("--capture-bg-accent-rgb", rgb);
    document.documentElement.style.setProperty("--capture-bg-x", `${background.x}%`);
    document.documentElement.style.setProperty("--capture-bg-y", `${background.y}%`);
    document.documentElement.style.setProperty("--capture-bg-spread", `${background.spread}%`);
    renderBackgroundLayers(background.layers || []);
  }

  function renderBackgroundLayers(layers) {
    if (!backgroundEffects) return;
    backgroundEffects.replaceChildren(...layers.map(createBackgroundLayerNode));
  }

  function createBackgroundLayerNode(layer, index) {
    const node = document.createElement("div");
    node.className = `capture-bg-effect is-${layer.type}`;
    node.style.left = `${layer.x}%`;
    node.style.top = `${layer.y}%`;
    node.style.width = `${layer.width}%`;
    node.style.height = `${layer.height}%`;
    node.style.opacity = String(layer.opacity);
    node.style.filter = `blur(${layer.blur}px)`;
    node.style.transform = `translate(-50%, -50%) rotate(${layer.rotate}deg)`;
    node.style.setProperty("--bg-color-a", layer.colorA);
    node.style.setProperty("--bg-color-b", layer.colorB);
    node.style.setProperty("--bg-hardness", `${layer.hardness}%`);
    node.dataset.bgLayer = String(index);

    if (layer.type === "particles") {
      node.style.background = "transparent";
      node.replaceChildren(...createParticleNodes(layer));
    }

    return node;
  }

  function createParticleNodes(layer) {
    const random = seededRandom(layer.seed);
    const nodes = [];
    for (let index = 0; index < layer.count; index += 1) {
      const size = layer.sizeMin + random() * (layer.sizeMax - layer.sizeMin);
      const dot = document.createElement("span");
      dot.style.left = `${random() * 100}%`;
      dot.style.top = `${random() * 100}%`;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.opacity = String(0.45 + random() * 0.55);
      dot.style.background = `radial-gradient(circle, ${index % 2 ? layer.colorB : layer.colorA} 0%, ${layer.colorA} ${layer.hardness}%, transparent 100%)`;
      nodes.push(dot);
    }
    return nodes;
  }

  function seededRandom(seed) {
    let value = Math.max(1, Math.round(seed || 1)) % 2147483647;
    return () => {
      value = value * 16807 % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function normalizeAppSize(value) {
    return {
      width: clamp(Math.round(finiteNumber(value.width, DEFAULT_APP_WIDTH)), 240, STAGE_WIDTH),
      height: clamp(Math.round(finiteNumber(value.height, DEFAULT_APP_HEIGHT)), 240, 1600)
    };
  }

  function applyAppSize(size) {
    APP_WIDTH = size.width;
    APP_HEIGHT = size.height;
    document.documentElement.style.setProperty("--app-panel-width", `${APP_WIDTH}px`);
    document.documentElement.style.setProperty("--app-panel-height", `${APP_HEIGHT}px`);
  }

  function applyFrameRect(rect) {
    const guideFrame = layer.querySelector(".guide-frame");
    guideFrame.hidden = false;
    guideFrame.classList.toggle("is-selected", isSelectedItem({ type: "frame" }));
    setBox(guideFrame, rect.left, rect.top);
    guideFrame.style.width = `${Math.round(rect.width)}px`;
    guideFrame.style.height = `${Math.round(rect.height)}px`;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    layer.style.setProperty("--guide-glow-x", `${Math.round((centerX / STAGE_WIDTH) * 100)}%`);
    layer.style.setProperty("--guide-glow-y", `${Math.round((centerY / STAGE_HEIGHT) * 100)}%`);
  }

  function applyFrameStyle(state) {
    const style = getFrameStyle(state);
    const guideFrame = layer.querySelector(".guide-frame");
    if (!guideFrame) return;
    guideFrame.style.setProperty("--guide-frame-color", rgbaFromHex(style.color, style.borderOpacity));
    guideFrame.style.setProperty("--guide-frame-width", `${style.width}px`);
    guideFrame.style.setProperty("--guide-frame-radius", `${style.radius}px`);
    guideFrame.style.setProperty("--guide-glow-color", hexToRgb(style.glowColor).join(", "));
    guideFrame.style.setProperty("--guide-glow-spread", `${style.glowSpread}px`);
    guideFrame.style.setProperty("--guide-glow-intensity", String(style.glowIntensity));
    guideFrame.style.setProperty("--guide-outer-display", style.outerWidth > 0 ? "block" : "none");
    guideFrame.style.setProperty("--guide-outer-color", style.outerColor);
    guideFrame.style.setProperty("--guide-outer-width", `${style.outerWidth}px`);
    guideFrame.style.setProperty("--guide-outer-radius", `${style.outerRadius}px`);
    guideFrame.style.setProperty("--guide-outer-gap", `${style.outerGap}px`);
  }

  function getTextOverlays(state) {
    if (!Array.isArray(state.textOverlays)) state.textOverlays = [];
    return state.textOverlays;
  }

  function normalizeTextOverlay(value) {
    value = value && typeof value === "object" ? value : {};
    return {
      text: typeof value.text === "string" ? value.text : DEFAULT_TEXT_OVERLAY.text,
      x: clamp(Math.round(finiteNumber(value.x, DEFAULT_TEXT_OVERLAY.x)), 0, STAGE_WIDTH),
      y: clamp(Math.round(finiteNumber(value.y, DEFAULT_TEXT_OVERLAY.y)), 0, STAGE_HEIGHT),
      size: clamp(Math.round(finiteNumber(value.size, DEFAULT_TEXT_OVERLAY.size)), 8, 400),
      color: normalizeColor(value.color, DEFAULT_TEXT_OVERLAY.color),
      anim: TEXT_OVERLAY_ANIMS.includes(value.anim) ? value.anim : DEFAULT_TEXT_OVERLAY.anim,
      animSpeed: clamp(finiteNumber(value.animSpeed, DEFAULT_TEXT_OVERLAY.animSpeed), 0.2, 8),
      animDir: value.animDir === "right" ? "right" : "left",
      shadow: clamp(Math.round(finiteNumber(value.shadow, DEFAULT_TEXT_OVERLAY.shadow)), 0, 100),
      tiltX: clamp(Math.round(finiteNumber(value.tiltX, DEFAULT_TEXT_OVERLAY.tiltX)), -80, 80),
      tiltY: clamp(Math.round(finiteNumber(value.tiltY, DEFAULT_TEXT_OVERLAY.tiltY)), -80, 80),
      curveX: clamp(Math.round(finiteNumber(value.curveX, DEFAULT_TEXT_OVERLAY.curveX)), -80, 80),
      curveY: clamp(Math.round(finiteNumber(value.curveY, DEFAULT_TEXT_OVERLAY.curveY)), -80, 80),
      font: TEXT_OVERLAY_FONT_VALUES.includes(value.font) ? value.font : DEFAULT_TEXT_OVERLAY.font
    };
  }

  function renderTextOverlays(state) {
    if (!overlayHost) return;
    overlayHost.replaceChildren();
    getTextOverlays(state).forEach((raw, index) => {
      const overlay = normalizeTextOverlay(raw);
      const el = document.createElement("div");
      el.dataset.guideDrag = "overlay";
      el.dataset.overlayIndex = String(index);
      const inner = document.createElement("span");
      inner.className = "guide-text-overlay-text";
      inner.textContent = overlay.text;
      el.appendChild(inner);
      applyOverlayStyle(el, inner, overlay);
      el.classList.toggle("is-selected", isSelectedItem({ type: "overlay", overlayIndex: index }));
      appendTextOverlayControls(el);
      el.appendChild(createTiltControl());
      el.appendChild(createDeleteHandle());
      overlayHost.appendChild(el);
      setBox(el, clamp(overlay.x, 0, STAGE_WIDTH), clamp(overlay.y, 0, STAGE_HEIGHT));
    });
  }

  // Outer element handles position + the one-shot entrance animation.
  // Inner element holds the text plus the static 3D tilt, so a perspective
  // placement and an animation can be combined without fighting over transform.
  function applyOverlayStyle(el, inner, overlay) {
    const animClass = overlay.anim && overlay.anim !== "none" ? ` anim-${overlay.anim}` : "";
    el.className = `guide-text-overlay${animClass}`;
    el.style.setProperty("--overlay-anim-duration", `${overlay.animSpeed}s`);
    el.style.setProperty("--overlay-slide-from", overlay.animDir === "right" ? "160px" : "-160px");

    inner.style.fontSize = `${overlay.size}px`;
    inner.style.color = overlay.color;
    inner.style.fontFamily = overlay.font || "";
    const transforms = [];
    if (overlay.tiltX || overlay.tiltY) transforms.push(`perspective(800px) rotateX(${overlay.tiltX}deg) rotateY(${overlay.tiltY}deg)`);
    if (overlay.curveX) transforms.push(`skewX(${overlay.curveX}deg)`);
    if (overlay.curveY) transforms.push(`skewY(${overlay.curveY}deg)`);
    inner.style.transform = transforms.length ? transforms.join(" ") : "none";
    if (overlay.shadow > 0 && overlay.anim !== "glitch") {
      const blur = Math.round(overlay.shadow / 3);
      const offset = Math.round(overlay.shadow / 10);
      inner.style.textShadow = `0 ${offset}px ${blur}px rgba(0, 0, 0, ${clamp(overlay.shadow / 110, 0, 0.9)})`;
    } else {
      inner.style.textShadow = "";
    }
  }

  function addTextOverlay() {
    if (!editMode) return;
    recordHistory();
    const state = getStepState(steps[activeIndex]);
    const overlays = getTextOverlays(state);
    overlays.push(normalizeTextOverlay({
      ...DEFAULT_TEXT_OVERLAY,
      x: 360,
      y: 240 + overlays.length * 80
    }));
    activeTextOverlay = overlays.length - 1;
    selectedItems = [{ type: "overlay", overlayIndex: activeTextOverlay }];
    writeSaved();
    renderStep();
    controls.overlayText?.focus();
    controls.overlayText?.select();
  }

  function deleteTextOverlay() {
    if (!editMode) return;
    const state = getStepState(steps[activeIndex]);
    const overlays = getTextOverlays(state);
    if (!overlays.length) return;
    recordHistory();
    overlays.splice(activeTextOverlay, 1);
    activeTextOverlay = clamp(activeTextOverlay, 0, Math.max(0, overlays.length - 1));
    selectedItems = [];
    writeSaved();
    renderStep();
  }

  function saveOverlayValues() {
    if (!editMode) return;
    recordHistory(false);
    const state = getStepState(steps[activeIndex]);
    const overlays = getTextOverlays(state);
    const overlay = overlays[activeTextOverlay];
    if (!overlay) return;
    overlays[activeTextOverlay] = normalizeTextOverlay({
      ...overlay,
      text: controls.overlayText ? controls.overlayText.value : overlay.text,
      size: numberValue(controls.overlaySize, overlay.size),
      color: stringValue(controls.overlayColor, overlay.color),
      ...overlayAnimationFromControl(overlay),
      animSpeed: numberValue(controls.overlayAnimSpeed, overlay.animSpeed),
      shadow: numberValue(controls.overlayShadow, overlay.shadow),
      tiltX: numberValue(controls.overlayTiltX, overlay.tiltX),
      tiltY: numberValue(controls.overlayTiltY, overlay.tiltY),
      font: stringValue(controls.overlayFont, overlay.font)
    });
    writeSaved();
    renderStep();
  }

  function overlayAnimationFromControl(fallback) {
    const value = stringValue(controls.overlayAnim, fallback.anim);
    if (value === "slide-left") return { anim: "slide", animDir: "left" };
    if (value === "slide-right") return { anim: "slide", animDir: "right" };
    return {
      anim: value,
      animDir: fallback.animDir === "right" ? "right" : "left"
    };
  }

  function overlayAnimationControlValue(overlay) {
    if (overlay.anim === "slide") return overlay.animDir === "right" ? "slide-right" : "slide-left";
    return overlay.anim;
  }

  function updateOverlayControls() {
    const state = getStepState(steps[activeIndex]);
    const overlays = getTextOverlays(state);
    const selected = selectedItems.length === 1 && selectedItems[0].type === "overlay"
      ? selectedItems[0].overlayIndex
      : null;
    if (Number.isFinite(selected)) activeTextOverlay = selected;
    activeTextOverlay = clamp(activeTextOverlay, 0, Math.max(0, overlays.length - 1));

    if (controls.overlaySelect) {
      controls.overlaySelect.innerHTML = overlays.length
        ? overlays.map((raw, i) => {
            const label = normalizeTextOverlay(raw).text.trim() || "text";
            return `<option value="${i}">${i + 1}. ${escapeHtml(label.slice(0, 24))}</option>`;
          }).join("")
        : '<option value="0">No text overlays</option>';
      controls.overlaySelect.value = String(activeTextOverlay);
      controls.overlaySelect.disabled = !editMode || !overlays.length;
    }

    const current = overlays[activeTextOverlay]
      ? normalizeTextOverlay(overlays[activeTextOverlay])
      : normalizeTextOverlay(DEFAULT_TEXT_OVERLAY);
    if (controls.overlayText && document.activeElement !== controls.overlayText) {
      controls.overlayText.value = current.text;
    }
    setInput(controls.overlaySize, current.size);
    setInput(controls.overlayColor, current.color);
    setInput(controls.overlayAnim, overlayAnimationControlValue(current));
    setInput(controls.overlayAnimSpeed, current.animSpeed);
    setInput(controls.overlayAnimDir, current.animDir);
    setInput(controls.overlayShadow, current.shadow);
    setInput(controls.overlayTiltX, current.tiltX);
    setInput(controls.overlayTiltY, current.tiltY);
    setInput(controls.overlayFont, current.font);

    if (controls.overlayAdd) controls.overlayAdd.disabled = !editMode;
    if (controls.overlayDelete) controls.overlayDelete.disabled = !editMode || !overlays.length;
    [
      controls.overlayText,
      controls.overlaySize,
      controls.overlayColor,
      controls.overlayAnim,
      controls.overlayAnimSpeed,
      controls.overlayAnimDir,
      controls.overlayShadow,
      controls.overlayTiltX,
      controls.overlayTiltY,
      controls.overlayFont
    ].forEach((input) => {
      if (input) input.disabled = !editMode || !overlays.length;
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
    ));
  }

  function applyTextStyle(state) {
    const style = getFrameStyle(state);
    applyCardBoxStyle(card, style);
    card.style.setProperty("--guide-title-color", style.titleColor);
    card.style.setProperty("--guide-title-size", `${style.titleSize}px`);
    card.style.setProperty("--guide-copy-color", style.copyColor);
    card.style.setProperty("--guide-copy-size", `${style.copySize}px`);
    card.style.setProperty("--guide-number-color", style.numberColor);
    card.style.setProperty("--guide-number-bg", style.numberBg);
  }

  function applyDetailTextStyle(node, state) {
    const style = getFrameStyle(state);
    applyCardBoxStyle(node, style);
    node.style.setProperty("--guide-title-color", style.titleColor);
    node.style.setProperty("--guide-title-size", `${Math.max(11, style.copySize + 1)}px`);
    node.style.setProperty("--guide-copy-color", style.copyColor);
    node.style.setProperty("--guide-copy-size", `${style.copySize}px`);
    node.style.setProperty("--guide-number-color", style.numberColor);
    node.style.setProperty("--guide-number-bg", style.numberBg);
  }

  function applyCardBoxStyle(node, style) {
    node.style.setProperty("--guide-card-border-width", `${style.cardBorderWidth}px`);
    node.style.setProperty("--guide-card-border-color", rgbaFromHex(style.cardBorderColor, style.cardBorderOpacity));
    node.style.setProperty("--guide-card-radius", `${style.cardRadius}px`);
    node.style.setProperty("--guide-card-bg", style.cardBg);
  }

  function applyTiltToNode(node, target) {
    const tiltX = finiteNumber(target?.tiltX, 0);
    const tiltY = finiteNumber(target?.tiltY, 0);
    const transform = tiltX || tiltY
      ? `perspective(820px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
      : "";
    if (node?.classList?.contains("guide-text-overlay")) {
      const index = Number(node.dataset.overlayIndex);
      const overlay = getTextOverlays(getStepState(steps[activeIndex]))[index];
      if (overlay) {
        overlay.tiltX = tiltX;
        overlay.tiltY = tiltY;
        applyOverlayStyle(node, node.querySelector(".guide-text-overlay-text"), normalizeTextOverlay(overlay));
      }
      return;
    }
    if (node) {
      node.style.transform = transform;
      node.style.transformStyle = tiltX || tiltY ? "preserve-3d" : "";
    }
  }

  function renderGuideCardContent(node, content) {
    ensureGuideCardSlots(node);
    const meta = node.querySelector("[data-guide-card-meta]");
    const title = node.querySelector("[data-guide-card-field='title']");
    const text = node.querySelector("[data-guide-card-field='text']");
    const image = node.querySelector("[data-guide-card-field='image']");

    meta.replaceChildren();
    if (hasValue(content.number)) {
      const number = document.createElement("span");
      number.className = "guide-detail-number";
      number.dataset.guideCardField = "number";
      number.textContent = content.number;
      meta.appendChild(number);
    }
    if (hasValue(content.emoji)) {
      const emoji = document.createElement("span");
      emoji.className = "guide-card-emoji";
      emoji.dataset.guideCardField = "emoji";
      emoji.textContent = content.emoji;
      meta.appendChild(emoji);
    }
    meta.hidden = !meta.childElementCount;

    title.textContent = content.title || "";
    title.hidden = !hasValue(content.title);
    text.textContent = content.text || "";
    text.hidden = !hasValue(content.text);

    if (hasValue(content.image)) {
      image.src = content.image;
      image.hidden = false;
    } else {
      image.removeAttribute("src");
      image.hidden = true;
    }
  }

  function ensureGuideCardSlots(node) {
    if (node.querySelector("[data-guide-card-meta]")) return;
    node.innerHTML = `
      <div class="guide-card-meta" data-guide-card-meta></div>
      <h2 class="guide-title" data-guide-card-field="title"></h2>
      <p class="guide-copy" data-guide-card-field="text"></p>
      <img class="guide-card-image" alt="" data-guide-card-field="image" hidden>
    `;
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function getFrameStyle(state) {
    const style = state.style || {};
    return {
      titleColor: normalizeColor(style.titleColor, DEFAULT_FRAME_STYLE.titleColor),
      titleSize: finiteNumber(style.titleSize, DEFAULT_FRAME_STYLE.titleSize),
      copyColor: normalizeColor(style.copyColor, DEFAULT_FRAME_STYLE.copyColor),
      copySize: finiteNumber(style.copySize, DEFAULT_FRAME_STYLE.copySize),
      numberColor: normalizeColor(style.numberColor, DEFAULT_FRAME_STYLE.numberColor),
      numberBg: normalizeColor(style.numberBg, DEFAULT_FRAME_STYLE.numberBg),
      cardBorderWidth: finiteNumber(style.cardBorderWidth, DEFAULT_FRAME_STYLE.cardBorderWidth),
      cardBorderColor: normalizeColor(style.cardBorderColor, DEFAULT_FRAME_STYLE.cardBorderColor),
      cardBorderOpacity: clamp(finiteNumber(style.cardBorderOpacity, DEFAULT_FRAME_STYLE.cardBorderOpacity), 0, 1),
      cardRadius: finiteNumber(style.cardRadius, DEFAULT_FRAME_STYLE.cardRadius),
      cardBg: normalizeColor(style.cardBg, DEFAULT_FRAME_STYLE.cardBg),
      color: normalizeColor(style.color, DEFAULT_FRAME_STYLE.color),
      width: finiteNumber(style.width, DEFAULT_FRAME_STYLE.width),
      borderOpacity: clamp(finiteNumber(style.borderOpacity, DEFAULT_FRAME_STYLE.borderOpacity), 0, 1),
      radius: finiteNumber(style.radius, DEFAULT_FRAME_STYLE.radius),
      glowColor: normalizeColor(style.glowColor, DEFAULT_FRAME_STYLE.glowColor),
      glowSpread: finiteNumber(style.glowSpread, DEFAULT_FRAME_STYLE.glowSpread),
      glowIntensity: clamp(finiteNumber(style.glowIntensity, DEFAULT_FRAME_STYLE.glowIntensity), 0, 1),
      outerColor: normalizeColor(style.outerColor, DEFAULT_FRAME_STYLE.outerColor),
      outerWidth: finiteNumber(style.outerWidth, DEFAULT_FRAME_STYLE.outerWidth),
      outerRadius: finiteNumber(style.outerRadius, DEFAULT_FRAME_STYLE.outerRadius),
      outerGap: finiteNumber(style.outerGap, DEFAULT_FRAME_STYLE.outerGap)
    };
  }

  function selectDetail(kind, index) {
    selectedItems = Number.isFinite(index) ? [{ type: "detail", detailKind: kind, detailIndex: index }] : [];
    syncSelectedDetail();
    updateSelectionUi();
    updateControls();
  }

  function clearSelection(updateUi = true) {
    selectedItems = [];
    selectedDetail = null;
    if (updateUi) {
      updateSelectionUi();
      updateControls();
    }
  }

  function beginMarquee(event) {
    if (!marquee || event.button !== 0) return;
    const point = stagePoint(event);
    clearSelection(false);
    event.preventDefault();
    event.stopPropagation();
    layer.setPointerCapture?.(event.pointerId);
    document.body.classList.add("guide-dragging");
    marquee.hidden = false;
    drag = {
      type: "marquee",
      startStageX: point.x,
      startStageY: point.y,
      node: layer
    };
    setMarqueeRect({ left: point.x, top: point.y, width: 0, height: 0 });
  }

  function moveMarquee(event) {
    const point = stagePoint(event);
    const rect = normalizeFreeRect({
      left: drag.startStageX,
      top: drag.startStageY,
      width: point.x - drag.startStageX,
      height: point.y - drag.startStageY
    });
    setMarqueeRect(rect);
    selectedItems = getSelectableLayoutItems()
      .filter((layoutItem) => rectsIntersect(rect, layoutItem.rect))
      .map((layoutItem) => layoutItem.item);
    syncSelectedDetail();
    updateSelectionUi();
  }

  function stagePoint(event) {
    const rect = layer.getBoundingClientRect();
    const scale = getCaptureZoom();
    return {
      x: clamp((event.clientX - rect.left) / scale, 0, STAGE_WIDTH),
      y: clamp((event.clientY - rect.top) / scale, 0, STAGE_HEIGHT)
    };
  }

  function setMarqueeRect(rect) {
    if (!marquee) return;
    marquee.style.left = `${Math.round(rect.left)}px`;
    marquee.style.top = `${Math.round(rect.top)}px`;
    marquee.style.width = `${Math.round(rect.width)}px`;
    marquee.style.height = `${Math.round(rect.height)}px`;
  }

  function getSelectableLayoutItems() {
    return Array.from(layer.querySelectorAll("[data-guide-drag='frame'], [data-guide-drag='card'], [data-guide-drag='detail']"))
      .map((node) => {
        const item = selectionItemFromNode(node);
        if (!item || node.hidden) return null;
        return { item, node, rect: readNodeRect(node) };
      })
      .filter(Boolean);
  }

  function isSelectedDetail(kind, index) {
    return isSelectedItem({ type: "detail", detailKind: kind, detailIndex: index });
  }

  function selectItem(item, additive) {
    if (!item) return;
    const key = itemKey(item);
    if (additive) {
      const existing = selectedItems.findIndex((selected) => itemKey(selected) === key);
      if (existing === -1) {
        selectedItems.push(item);
      } else {
        selectedItems.splice(existing, 1);
      }
    } else {
      selectedItems = [item];
    }
    syncSelectedDetail();
    updateSelectionUi();
    updateControls();
  }

  function syncSelectedDetail() {
    const selected = selectedItems.length === 1 ? selectedItems[0] : null;
    selectedDetail = selected?.type === "detail"
      ? { kind: selected.detailKind, index: selected.detailIndex }
      : null;
  }

  function isSelectedItem(item) {
    const key = itemKey(item);
    return selectedItems.some((selected) => itemKey(selected) === key);
  }

  function isDeletableItem(item) {
    return item?.type === "card" || item?.type === "detail" || item?.type === "frame" || item?.type === "overlay";
  }

  function itemKey(item) {
    if (!item) return "";
    if (item.type === "detail") return `detail:${item.detailKind}:${item.detailIndex}`;
    if (item.type === "overlay") return `overlay:${item.overlayIndex}`;
    return item.type;
  }

  function selectionItemFromNode(node) {
    const type = node?.dataset?.guideDrag || "";
    if (type === "card" || type === "frame") return { type };
    if (type === "overlay") return { type: "overlay", overlayIndex: Number(node.dataset.overlayIndex) };
    if (type === "detail") {
      return {
        type: "detail",
        detailKind: node.dataset.detailKind || "builtIn",
        detailIndex: Number(node.dataset.detailIndex)
      };
    }
    return null;
  }

  function updateSelectionUi() {
    if (!layer) return;
    layer.querySelector(".guide-frame")?.classList.toggle("is-selected", isSelectedItem({ type: "frame" }));
    card?.classList.toggle("is-selected", isSelectedItem({ type: "card" }));
    detailHost?.querySelectorAll(".guide-detail").forEach((node) => {
      node.classList.toggle("is-selected", isSelectedItem(selectionItemFromNode(node)));
    });
    overlayHost?.querySelectorAll(".guide-text-overlay").forEach((node) => {
      node.classList.toggle("is-selected", isSelectedItem(selectionItemFromNode(node)));
    });
    updateBorderControlHandles();
    updateColorControlHandles();
    updateTextOverlayControlHandles();
    renderAlignMenu();
  }

  function renderAlignMenu() {
    if (!alignMenu) return;
    const items = getSelectedLayoutItems();
    if (!editMode || drag?.type === "marquee" || items.length < 2) {
      alignMenu.hidden = true;
      return;
    }
    const bounds = boundsForRects(items.map((item) => item.rect));
    alignMenu.hidden = false;
    alignMenu.style.left = `${Math.round(clamp(bounds.left, 12, STAGE_WIDTH - 520))}px`;
    alignMenu.style.top = `${Math.round(clamp(bounds.top - 42, 12, STAGE_HEIGHT - 46))}px`;
  }

  function handleAlignMenuClick(event) {
    const button = event.target.closest("[data-guide-align]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    alignSelectedItems(button.dataset.guideAlign);
  }

  function alignSelectedItems(command) {
    const items = getSelectedLayoutItems();
    if (items.length < 2) return;
    recordHistory();

    const bounds = boundsForRects(items.map((item) => item.rect));
    if (command === "left") {
      items.forEach((item) => setLayoutItemPosition(item, bounds.left, item.rect.top));
    } else if (command === "top") {
      items.forEach((item) => setLayoutItemPosition(item, item.rect.left, bounds.top));
    } else if (command === "right") {
      items.forEach((item) => setLayoutItemPosition(item, bounds.right - item.rect.width, item.rect.top));
    } else if (command === "bottom") {
      items.forEach((item) => setLayoutItemPosition(item, item.rect.left, bounds.bottom - item.rect.height));
    } else if (command === "distributeX") {
      distributeItems(items, "x");
    } else if (command === "distributeY") {
      distributeItems(items, "y");
    }

    writeSaved();
    updateSelectionUi();
    updateControls();
  }

  function distributeItems(items, axis) {
    if (items.length < 3) return;
    const isX = axis === "x";
    const sorted = [...items].sort((a, b) => (
      isX ? a.rect.left - b.rect.left : a.rect.top - b.rect.top
    ));
    const firstStart = isX ? sorted[0].rect.left : sorted[0].rect.top;
    const lastRect = sorted[sorted.length - 1].rect;
    const lastEnd = isX ? lastRect.left + lastRect.width : lastRect.top + lastRect.height;
    const totalSize = sorted.reduce((sum, item) => sum + (isX ? item.rect.width : item.rect.height), 0);
    const gap = Math.max(0, (lastEnd - firstStart - totalSize) / (sorted.length - 1));
    let cursor = firstStart;

    sorted.forEach((item) => {
      const left = isX ? cursor : item.rect.left;
      const top = isX ? item.rect.top : cursor;
      setLayoutItemPosition(item, left, top);
      cursor += (isX ? item.rect.width : item.rect.height) + gap;
    });
  }

  function getSelectedLayoutItems() {
    return selectedItems.map((item) => {
      const node = nodeForSelectionItem(item);
      if (!node) return null;
      return { item, node, rect: readNodeRect(node) };
    }).filter(Boolean);
  }

  function nodeForSelectionItem(item) {
    if (item.type === "card") return card;
    if (item.type === "frame") return layer.querySelector(".guide-frame");
    if (item.type === "overlay") {
      return overlayHost.querySelector(`.guide-text-overlay[data-overlay-index="${item.overlayIndex}"]`);
    }
    if (item.type === "detail") {
      return detailHost.querySelector(`.guide-detail[data-detail-kind="${cssEscape(item.detailKind)}"][data-detail-index="${item.detailIndex}"]`);
    }
    return null;
  }

  function setLayoutItemPosition(layoutItem, left, top) {
    const state = getStepState(steps[activeIndex]);
    const item = layoutItem.item;
    const x = clamp(Math.round(left), 0, STAGE_WIDTH - Math.max(24, layoutItem.rect.width));
    const y = clamp(Math.round(top), 0, STAGE_HEIGHT - Math.max(24, layoutItem.rect.height));

    if (item.type === "frame") {
      state.frame = plainRect(clampRect({
        ...layoutItem.rect,
        left: x,
        top: y
      }, 24, 24));
      applyFrameRect(state.frame);
      return;
    }

    if (item.type === "card") {
      state.card = { ...(state.card || {}), x, y };
      setBox(card, x, y);
      return;
    }

    if (item.type === "detail") {
      const detail = getDetailStateByKind(steps[activeIndex], item.detailKind, item.detailIndex);
      detail.x = x;
      detail.y = y;
      setBox(layoutItem.node, x, y);
      return;
    }

    if (item.type === "overlay") {
      const overlay = getTextOverlays(state)[item.overlayIndex];
      if (overlay) {
        overlay.x = x;
        overlay.y = y;
        setBox(layoutItem.node, x, y);
      }
    }
  }

  function boundsForRects(rects) {
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.left + rect.width));
    const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function normalizeFreeRect(rect) {
    const left = rect.width < 0 ? rect.left + rect.width : rect.left;
    const top = rect.height < 0 ? rect.top + rect.height : rect.top;
    return {
      left,
      top,
      width: Math.abs(rect.width),
      height: Math.abs(rect.height)
    };
  }

  function rectsIntersect(a, b) {
    return a.left <= b.left + b.width
      && a.left + a.width >= b.left
      && a.top <= b.top + b.height
      && a.top + a.height >= b.top;
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(String(value));
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function recordHistory(shouldUpdateControls = true) {
    undoStack.push({
      activeIndex,
      saved: cloneSaved(saved)
    });
    if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0;
    if (shouldUpdateControls) updateControls();
  }

  function undoEdit() {
    if (!undoStack.length) return;
    redoStack.push({ activeIndex, saved: cloneSaved(saved) });
    const previous = undoStack.pop();
    activeIndex = previous.activeIndex;
    saved = cloneSaved(previous.saved);
    selectedDetail = null;
    selectedItems = [];
    writeSaved();
    renderStep();
    updateControls();
  }

  function redoEdit() {
    if (!redoStack.length) return;
    undoStack.push({ activeIndex, saved: cloneSaved(saved) });
    const next = redoStack.pop();
    activeIndex = next.activeIndex;
    saved = cloneSaved(next.saved);
    selectedDetail = null;
    selectedItems = [];
    writeSaved();
    renderStep();
    updateControls();
  }

  function cloneSaved(value) {
    return JSON.parse(JSON.stringify(value || { steps: {} }));
  }

  function setBox(node, x, y) {
    node.style.left = `${Math.round(x)}px`;
    node.style.top = `${Math.round(y)}px`;
  }

  function readNodeRect(node) {
    const left = Number.parseFloat(node.style.left) || 0;
    const top = Number.parseFloat(node.style.top) || 0;
    const width = Number.parseFloat(node.style.width) || node.offsetWidth;
    const height = Number.parseFloat(node.style.height) || node.offsetHeight;
    return { left, top, width, height };
  }

  function resizedRect(rect, dx, dy, corner) {
    const next = { ...rect };
    if (corner.includes("e")) next.width += dx;
    if (corner.includes("s")) next.height += dy;
    if (corner.includes("w")) {
      next.left += dx;
      next.width -= dx;
    }
    if (corner.includes("n")) {
      next.top += dy;
      next.height -= dy;
    }
    return next;
  }

  function clampRect(rect, minWidth, minHeight) {
    const width = clamp(rect.width, minWidth, STAGE_WIDTH - 12);
    const height = clamp(rect.height, minHeight, STAGE_HEIGHT - 12);
    const left = clamp(rect.left, 0, STAGE_WIDTH - width);
    const top = clamp(rect.top, 0, STAGE_HEIGHT - height);
    return { left, top, width, height, right: left + width, bottom: top + height };
  }

  function normalizeRect(savedRect, fallback) {
    if (!savedRect) return fallback;
    return clampRect({
      left: Number(savedRect.left ?? fallback.left),
      top: Number(savedRect.top ?? fallback.top),
      width: Number(savedRect.width ?? fallback.width),
      height: Number(savedRect.height ?? fallback.height)
    }, 24, 24);
  }

  function paddedRect(rect, pad) {
    return clampRect({
      left: rect.left - pad,
      top: rect.top - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2
    }, 24, 24);
  }

  function plainRect(rect) {
    return {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }

  function setInput(input, value) {
    if (!input || document.activeElement === input) return;
    if (input.tagName === "SELECT" || input.type === "color" || typeof value === "string") {
      input.value = String(value);
      return;
    }
    input.value = String(Math.round(Number(value) * 100) / 100);
  }

  function setChecked(input, value) {
    if (!input || document.activeElement === input) return;
    input.checked = Boolean(value);
  }

  function numberValue(input, fallback = 0) {
    const value = Number(input?.value);
    return Number.isFinite(value) ? value : fallback;
  }

  function stringValue(input, fallback) {
    return input?.value || fallback;
  }

  function finiteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : fallback;
  }

  function hexToRgb(value) {
    const color = normalizeColor(value, "#9e68ff").slice(1);
    return [
      Number.parseInt(color.slice(0, 2), 16),
      Number.parseInt(color.slice(2, 4), 16),
      Number.parseInt(color.slice(4, 6), 16)
    ];
  }

  function rgbaFromHex(value, opacity) {
    const [r, g, b] = hexToRgb(value);
    return `rgba(${r}, ${g}, ${b}, ${clamp(finiteNumber(opacity, 1), 0, 1)})`;
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+\n/g, "\n").trim();
  }

  function getCaptureZoom() {
    return Number(getComputedStyle(document.documentElement).getPropertyValue("--capture-zoom")) || 1;
  }

  function getBaseAppLeft() {
    return (STAGE_WIDTH - APP_WIDTH) / 2;
  }

  function getBaseAppTop() {
    return (BASE_STAGE_HEIGHT - APP_HEIGHT) / 2;
  }

  function getFocusedAppRect() {
    const focus = getCurrentFocus();
    const left = getBaseAppLeft() + focus.x;
    const top = getBaseAppTop() + focus.y;
    const width = APP_WIDTH * focus.scale;
    const height = APP_HEIGHT * focus.scale;
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }
})();
