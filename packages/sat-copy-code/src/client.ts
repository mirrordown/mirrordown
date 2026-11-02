// The copy buttons' client script: import it once per page. A button is an invoker command (`command="--copy"`) aimed at its code block's `<pre>`, which this script handles by copying the `<code>` in it. The buttons render `hidden`, and this script shows them, so a page without it, or a browser without invoker commands or the clipboard, has no button that does nothing. It shows them with a stylesheet adopted into the document, and listens on the document, so buttons on pages that client-side navigation swaps in work too.

const COMMAND = `--copy`;
// How long a button shows that its block was copied.
const COPIED_FOR = 2000;

const timers = new WeakMap<HTMLElement, number>();

// A polite live region, so screen readers hear that the code was copied; attached again after navigation replaces the body it was in.
const status = document.createElement(`div`);
status.setAttribute(`aria-live`, `polite`);
status.style.cssText = `position:absolute;inline-size:1px;block-size:1px;overflow:clip;clip-path:inset(50%);white-space:nowrap`;
const announce = (message: string): void => {
  if (!status.isConnected) document.body.append(status);
  status.textContent = message;
};

const copy = async (button: HTMLElement, pre: Element): Promise<void> => {
  const code = pre.querySelector(`:scope > code`) ?? pre;
  try {
    await navigator.clipboard.writeText(code.textContent.replace(/\n$/, ``));
  } catch {
    announce(`Couldn't copy the code`);
    return;
  }
  announce(`Copied`);
  button.dataset.copied = ``;
  button.setAttribute(`aria-label`, `Copied`);
  clearTimeout(timers.get(button));
  timers.set(
    button,
    window.setTimeout(() => {
      // Cleared, so copying again is announced again.
      status.textContent = ``;
      delete button.dataset.copied;
      button.setAttribute(`aria-label`, `Copy code`);
    }, COPIED_FOR)
  );
};

// The clipboard is only there in secure contexts.
if (`CommandEvent` in window && `clipboard` in navigator) {
  document.addEventListener(
    `command`,
    (event) => {
      if (!(event instanceof CommandEvent) || event.command !== COMMAND) return;
      const { source, target } = event;
      if (source instanceof HTMLElement && target instanceof Element)
        void copy(source, target);
    },
    // The command event doesn't bubble: catch it on its way down to the <pre>.
    { capture: true }
  );

  // In the stylesheet's layer, so the page's own CSS can still hide the buttons.
  const reveal = new CSSStyleSheet();
  reveal.replaceSync(
    `@layer markdown-copy-code { .markdown-copy-code[hidden] { display: flex; } }`
  );
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, reveal];
}

// A module, so its names stay out of the global scope.
export {};
