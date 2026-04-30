// Runs inside the VS Code markdown preview webview.
// img.src is already a vscode-resource:// URI — fetch() can load it directly.

const DONE_ATTR = `data-svg-inlined`;

async function inlineSvgImages(): Promise<void> {
  const images = document.querySelectorAll<HTMLImageElement>(
    `img[src$=".svg"]:not([${DONE_ATTR}])`,
  );

  for (const img of images) {
    img.setAttribute(DONE_ATTR, `1`);
    try {
      const res = await fetch(img.src);
      if (!res.ok) continue;
      const svgText = (await res.text()).trim();

      const template = document.createElement(`template`);
      template.innerHTML = svgText;
      const svg = template.content.querySelector(`svg`);
      if (!svg) continue;

      if (img.alt) svg.setAttribute(`aria-label`, img.alt);
      if (img.className) svg.setAttribute(`class`, img.className);
      if (img.style.cssText) svg.setAttribute(`style`, img.style.cssText);

      img.replaceWith(svg);
    } catch {
      // Leave the img tag as-is on failure
    }
  }
}

window.addEventListener(`vscode.markdown.updateContent`, () => void inlineSvgImages());
void inlineSvgImages();
