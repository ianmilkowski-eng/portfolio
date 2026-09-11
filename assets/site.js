(() => {
  "use strict";

  function initializeViewer() {
    const dialog = document.querySelector("#image-viewer");
    if (!dialog || typeof dialog.showModal !== "function") return;

    const title = dialog.querySelector("#viewer-title");
    const image = dialog.querySelector("[data-viewer-image]");
    const caption = dialog.querySelector("[data-viewer-caption]");
    const close = dialog.querySelector("[data-viewer-close]");
    const previous = dialog.querySelector("[data-viewer-prev]");
    const next = dialog.querySelector("[data-viewer-next]");
    const count = dialog.querySelector("[data-viewer-count]");
    if (!title || !image || !caption || !close || !previous || !next || !count) return;

    caption.setAttribute("role", "status");
    let links = [];
    let index = 0;
    let opener = null;
    let request = 0;

    function displayImage() {
      const link = links[index];
      if (!link) return;
      const currentRequest = ++request;
      const sourceImage = link.querySelector("img");
      const description = link.dataset.caption || "";
      const alternative = sourceImage?.alt || description || "Project artwork";

      title.textContent = alternative;
      caption.textContent = "Loading image…";
      image.hidden = true;
      image.removeAttribute("src");
      image.alt = "";
      count.textContent = `${index + 1} / ${links.length}`;
      previous.disabled = links.length < 2;
      next.disabled = links.length < 2;

      const pendingImage = new Image();
      pendingImage.onload = () => {
        if (currentRequest !== request || !dialog.open) return;
        image.src = pendingImage.src;
        image.alt = alternative;
        image.hidden = false;
        caption.textContent = description;
      };
      pendingImage.onerror = () => {
        if (currentRequest !== request || !dialog.open) return;
        caption.textContent = "This image could not be loaded. Try another image or close the preview and try again.";
      };
      // Read the current link each time, including an updated color selection.
      pendingImage.src = link.href;
    }

    function moveBy(direction) {
      if (links.length < 2) return;
      index = (index + direction + links.length) % links.length;
      displayImage();
    }

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[data-lightbox]") : null;
      if (!link || !link.href || link.hasAttribute("download")) return;

      const uniqueImages = new Map();
      for (const candidate of document.querySelectorAll("a[data-lightbox][href]")) {
        if (candidate.closest("[hidden], details:not([open])")) continue;
        const existing = uniqueImages.get(candidate.href);
        const existingImage = existing?.querySelector("img");
        const candidateImage = candidate.querySelector("img");
        // Text and image links to the same artwork share a slide, with the richest alt text.
        if (!existing || (!existingImage && candidateImage) || (!existingImage?.alt && candidateImage?.alt)) {
          uniqueImages.set(candidate.href, candidate);
        }
      }
      links = [...uniqueImages.values()];
      index = links.findIndex((candidate) => candidate.href === link.href);
      if (index < 0) return;

      opener = link;
      try {
        dialog.showModal();
      } catch {
        // Preserve the original image link if this browser cannot open a dialog.
        return;
      }
      event.preventDefault();
      displayImage();
      close.focus({ preventScroll: true });
    });

    close.addEventListener("click", () => dialog.close());
    previous.addEventListener("click", () => moveBy(-1));
    next.addEventListener("click", () => moveBy(1));
    dialog.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveBy(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      request += 1;
      image.hidden = true;
      image.removeAttribute("src");
      image.alt = "";
      caption.textContent = "";
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      opener = null;
    });
  }

  function initializeColorSelector() {
    const controls = document.querySelector("[data-color-controls]");
    const image = document.querySelector("[data-color-image]");
    const link = document.querySelector("[data-color-link]");
    const label = document.querySelector("[data-color-label]");
    if (!controls || !image || !link || !label) return;

    const buttons = [...controls.querySelectorAll("button[data-color][data-image]")];
    if (!buttons.length) return;
    let request = 0;
    let currentLabel = label.textContent.trim();

    for (const button of buttons) {
      button.addEventListener("click", () => {
        const currentRequest = ++request;
        const selectedLabel = button.dataset.label || button.textContent.trim();
        label.textContent = `Loading ${selectedLabel}…`;

        const pendingImage = new Image();
        pendingImage.onload = () => {
          if (currentRequest !== request) return;
          image.src = pendingImage.src;
          image.alt = button.dataset.alt || selectedLabel;
          // Remove an optional original responsive source set after choosing a variant.
          image.removeAttribute("srcset");
          image.removeAttribute("sizes");
          link.href = button.dataset.original || pendingImage.src;
          link.dataset.caption = selectedLabel;
          currentLabel = selectedLabel;
          label.textContent = selectedLabel;
          for (const option of buttons) {
            option.setAttribute("aria-pressed", String(option === button));
          }
        };
        pendingImage.onerror = () => {
          if (currentRequest !== request) return;
          label.textContent = `Could not load ${selectedLabel}.${currentLabel ? ` Showing ${currentLabel}.` : " Please try again."}`;
        };
        pendingImage.src = button.dataset.image;
      });
    }
    for (const button of buttons) {
      if (!button.hasAttribute("aria-pressed")) button.setAttribute("aria-pressed", "false");
    }
    controls.hidden = false;
  }

  function initialize() {
    initializeViewer();
    initializeColorSelector();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
