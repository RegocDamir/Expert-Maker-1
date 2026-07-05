(() => {
  document.addEventListener("keydown", (event) => {
    if (document.body.classList.contains("capture-output") || document.body.classList.contains("capture-render")) return;
    if (event.key.toLowerCase() === "z" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      document.body.classList.toggle("capture-controls-hidden");
      event.preventDefault();
    }
  });
})();
