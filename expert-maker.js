(() => {
  let imageUrl = null;

  document.addEventListener("DOMContentLoaded", () => {
    const frame = document.querySelector(".capture-frame");
    const imageInput = document.querySelector("[data-target-image]");
    const urlInput = document.querySelector("[data-target-url]");
    const loadUrl = document.querySelector("[data-target-load-url]");
    const clear = document.querySelector("[data-target-clear]");

    function post(message) {
      frame?.contentWindow?.postMessage(message, "*");
    }

    imageInput?.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      if (!file) return;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageUrl = URL.createObjectURL(file);
      post({ type: "EXPERT_MAKER_TARGET_IMAGE", url: imageUrl });
    });

    loadUrl?.addEventListener("click", () => {
      const url = normalizeUrl(urlInput?.value || "");
      if (!url) return;
      post({ type: "EXPERT_MAKER_TARGET_URL", url });
    });

    urlInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      loadUrl?.click();
    });

    clear?.addEventListener("click", () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageUrl = null;
      if (imageInput) imageInput.value = "";
      if (urlInput) urlInput.value = "";
      post({ type: "EXPERT_MAKER_TARGET_CLEAR" });
    });

    frame?.addEventListener("load", () => {
      if (imageUrl) post({ type: "EXPERT_MAKER_TARGET_IMAGE", url: imageUrl });
    });
  });

  function normalizeUrl(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }
})();
