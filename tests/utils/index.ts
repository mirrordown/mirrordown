export function normalizeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}
