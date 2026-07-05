(() => {
  announceReady();
  window.setTimeout(announceReady, 100);
  window.setTimeout(announceReady, 500);

  window.addEventListener("message", (event) => {
    const message = event.data || {};
    if (message.type === "EXPERT_MAKER_TARGET_IMAGE") {
      showImage(message.url);
      return;
    }
    if (message.type === "EXPERT_MAKER_TARGET_URL") {
      showUrl(message.url);
      return;
    }
    if (message.type === "EXPERT_MAKER_TARGET_CLEAR") {
      clearTarget();
    }
  });

  function announceReady() {
    window.parent?.postMessage({ type: "SPACECAST_GUIDE_BRIDGE_READY" }, "*");
  }

  function showImage(url) {
    const image = document.querySelector("[data-target-image-preview]");
    const frame = document.querySelector("[data-target-url-frame]");
    const empty = document.querySelector("[data-guide-target='primary']");
    if (!image) return;
    image.src = url || "";
    image.hidden = !url;
    if (frame) {
      frame.hidden = true;
      frame.removeAttribute("src");
    }
    if (empty) empty.hidden = Boolean(url);
  }

  function showUrl(url) {
    const image = document.querySelector("[data-target-image-preview]");
    const frame = document.querySelector("[data-target-url-frame]");
    const empty = document.querySelector("[data-guide-target='primary']");
    if (!frame) return;
    frame.src = url || "about:blank";
    frame.hidden = !url;
    if (image) {
      image.hidden = true;
      image.removeAttribute("src");
    }
    if (empty) empty.hidden = Boolean(url);
  }

  function clearTarget() {
    const image = document.querySelector("[data-target-image-preview]");
    const frame = document.querySelector("[data-target-url-frame]");
    const empty = document.querySelector("[data-guide-target='primary']");
    if (image) {
      image.hidden = true;
      image.removeAttribute("src");
    }
    if (frame) {
      frame.hidden = true;
      frame.removeAttribute("src");
    }
    if (empty) empty.hidden = false;
  }
})();

