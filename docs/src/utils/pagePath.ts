/**
 * The path of the page a request is for, without a trailing slash: `/guide/plugins/mark`. The development server asks for a page by that path, and the built site by its folder (`/guide/plugins/mark/`), so the raw pathname differs between the two. The sidebar and the page links compare it with a page's `href`, and the edit links build a file name from it, so with the slash left on, the built site marked no page as the current one, linked every page to the first one as its next, and edited `mark/.md`.
 */
export const pagePath = (url: string): string =>
  new URL(url).pathname.replace(/(?<=.)\/$/, "");
