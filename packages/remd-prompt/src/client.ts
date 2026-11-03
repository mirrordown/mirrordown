// The prompts' client script: import it once per page. It copies a prompt when its copy button is pressed, and when a service that can't take the prompt in its URL is opened, so the reader can paste it there. The copy buttons render `hidden`, and this script shows them, so a page without it, or a browser without the clipboard, has no button that does nothing. It listens on the document, so prompts on pages that client-side navigation swaps in work too.

const PROMPT = `.markdown-prompt`;
const COPY = `.markdown-prompt-copy`;
const SERVICE = `a.markdown-prompt-service[data-copy]`;
// How long a button shows that its prompt was copied.
const COPIED_FOR = 2000;

const timers = new WeakMap<HTMLElement, number>();
// Each button's own name, given back once its copied state ends.
const labels = new WeakMap<HTMLElement, string>();

// A polite live region, so screen readers hear that the prompt was copied; attached again after navigation replaces the body it was in.
const status = document.createElement(`div`);
status.setAttribute(`aria-live`, `polite`);
status.style.cssText = `position:absolute;inline-size:1px;block-size:1px;overflow:clip;clip-path:inset(50%);white-space:nowrap`;
const announce = (message: string): void => {
  if (!status.isConnected) document.body.append(status);
  status.textContent = message;
};

// The prompt's text, as written: without the newline a code block ends with.
const promptText = (prompt: Element): string | undefined =>
  prompt
    .querySelector(`.markdown-prompt-body > code`)
    ?.textContent.replace(/\n$/, ``);

const copy = async (prompt: Element): Promise<boolean> => {
  const text = promptText(prompt);
  if (text === undefined) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    announce(`Couldn't copy the prompt`);
    return false;
  }
};

const copied = (button: HTMLElement): void => {
  const message = button.dataset.labelCopied ?? `Copied`;
  if (!labels.has(button))
    labels.set(button, button.getAttribute(`aria-label`) ?? ``);
  announce(message);
  button.dataset.state = `copied`;
  button.setAttribute(`aria-label`, message);
  clearTimeout(timers.get(button));
  timers.set(
    button,
    window.setTimeout(() => {
      // Cleared, so copying again is announced again.
      status.textContent = ``;
      delete button.dataset.state;
      button.setAttribute(`aria-label`, labels.get(button) ?? ``);
    }, COPIED_FOR)
  );
};

const copyFromButton = async (
  prompt: Element,
  button: HTMLElement
): Promise<void> => {
  if (await copy(prompt)) copied(button);
};

// The link opens the service as usual; the prompt is on the clipboard by the time the reader gets there.
const copyForService = async (
  prompt: Element,
  service: HTMLElement
): Promise<void> => {
  if (await copy(prompt)) announce(service.dataset.copy ?? ``);
};

// The clipboard is only there in secure contexts.
if (`clipboard` in navigator) {
  document.addEventListener(`click`, (event) => {
    if (!(event.target instanceof Element)) return;
    const prompt = event.target.closest(PROMPT);
    if (!prompt) return;
    const button = event.target.closest<HTMLElement>(COPY);
    if (button) {
      void copyFromButton(prompt, button);
      return;
    }
    const service = event.target.closest<HTMLElement>(SERVICE);
    if (service) void copyForService(prompt, service);
  });

  // In the stylesheet's layer, so the page's own CSS can still hide the buttons.
  const reveal = new CSSStyleSheet();
  reveal.replaceSync(
    `@layer markdown-prompt { .markdown-prompt-copy[hidden] { display: inline-flex; } }`
  );
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, reveal];
}

// A module, so its names stay out of the global scope.
export {};
