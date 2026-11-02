// The file trees' optional client script: import it once per page. Without it a tree is nested lists whose folders are <details>, which open and close by mouse, keyboard and screen reader. With it, each tree becomes an ARIA tree (https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): one tab stop, the arrow keys to move between rows and open and close folders, Home and End, `*` to open a folder's siblings, and typing a name's first letters to jump to it. Trees that client-side navigation swaps in are upgraded too.
//
// A file's item is its <li>. A folder's is its <details>, since browsers keep a <details>'s own role even when told it has none: its <li> takes no role instead, and its <summary> leaves the tab order.

const TREE = `.markdown-file-tree`;
const ITEM = `[role="treeitem"]`;
const ROW = `.markdown-file-tree-row`;
const NAME = `.markdown-file-tree-name`;

const upgraded = new WeakSet<Element>();

// The item a row's <li> holds.
const itemOf = (entry: Element | null | undefined): HTMLElement | null =>
  entry?.querySelector<HTMLElement>(`:scope > details`) ??
  (entry instanceof HTMLElement ? entry : null);

const isFolder = (item: Element): item is HTMLDetailsElement =>
  item instanceof HTMLDetailsElement;

// An item is shown when no folder it's in is closed.
const isShown = (tree: Element, item: HTMLElement): boolean => {
  const closed = item.parentElement?.closest(`details:not([open])`);
  return !closed || !tree.contains(closed);
};

const itemsOf = (tree: Element): HTMLElement[] =>
  [...tree.querySelectorAll<HTMLElement>(ITEM)].filter((item) =>
    isShown(tree, item)
  );

const focus = (tree: Element, item: HTMLElement | null | undefined): void => {
  if (!item) return;
  for (const other of tree.querySelectorAll<HTMLElement>(
    `${ITEM}[tabindex="0"]`
  ))
    other.tabIndex = -1;
  item.tabIndex = 0;
  item.focus();
};

// Typed letters within a moment of each other search together, as in the APG's example.
let typed = ``;
let typedAt = 0;

const onKey = (tree: HTMLElement, event: KeyboardEvent): void => {
  const item =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(ITEM)
      : null;
  if (!item || !tree.contains(item)) return;
  const items = itemsOf(tree);
  const index = items.indexOf(item);
  const folder = isFolder(item) ? item : null;
  const rtl = getComputedStyle(tree).direction === `rtl`;
  const key =
    rtl && event.key === `ArrowLeft`
      ? `ArrowRight`
      : rtl && event.key === `ArrowRight`
        ? `ArrowLeft`
        : event.key;
  switch (key) {
    case `ArrowDown`:
      focus(tree, items[index + 1]);
      break;
    case `ArrowUp`:
      focus(tree, items[index - 1]);
      break;
    case `Home`:
      focus(tree, items[0]);
      break;
    case `End`:
      focus(tree, items.at(-1));
      break;
    case `ArrowRight`:
      if (!folder) return;
      if (folder.open)
        focus(tree, itemOf(folder.querySelector(`:scope > ul > li`)));
      else folder.open = true;
      break;
    case `ArrowLeft`:
      if (folder?.open) folder.open = false;
      else focus(tree, item.parentElement?.closest<HTMLElement>(ITEM) ?? null);
      break;
    case `Enter`:
    case ` `:
      if (!folder) return;
      folder.open = !folder.open;
      break;
    case `*`:
      for (const sibling of item.closest(`li`)?.parentElement?.children ?? []) {
        const siblingItem = itemOf(sibling);
        if (siblingItem && isFolder(siblingItem)) siblingItem.open = true;
      }
      break;
    default: {
      if (event.key.length !== 1 || event.ctrlKey || event.metaKey) return;
      const now = event.timeStamp;
      typed = now - typedAt < 500 ? typed + event.key : event.key;
      typedAt = now;
      const search = typed.toLowerCase();
      const matches = (candidate: HTMLElement): boolean =>
        (candidate.querySelector(NAME)?.textContent ?? ``)
          .toLowerCase()
          .startsWith(search);
      // From the next item on, wrapping; a search still being typed may match the focused item.
      const start = typed.length > 1 ? index : index + 1;
      const ordered = [...items.slice(start), ...items.slice(0, start)];
      focus(tree, ordered.find(matches));
      break;
    }
  }
  event.preventDefault();
};

const label = (tree: HTMLElement): void => {
  let first = true;
  for (const entry of tree.querySelectorAll<HTMLElement>(`li`)) {
    const item = itemOf(entry);
    if (!item) continue;
    item.setAttribute(`role`, `treeitem`);
    item.tabIndex = first ? 0 : -1;
    first = false;
    item.setAttribute(`aria-level`, entry.dataset.depth ?? `1`);
    const siblings = [...(entry.parentElement?.children ?? [])];
    item.setAttribute(`aria-setsize`, String(siblings.length));
    item.setAttribute(`aria-posinset`, String(siblings.indexOf(entry) + 1));
    if (!isFolder(item)) continue;
    entry.setAttribute(`role`, `none`);
    item.setAttribute(`aria-expanded`, String(item.open));
    // Named by its row alone: from its content, it would take its whole subtree's text.
    const row = item.querySelector(`:scope > ${ROW}`);
    item.setAttribute(
      `aria-label`,
      [...(row?.children ?? [])]
        .map((part) => part.textContent.trim())
        .filter((text) => text !== ``)
        .join(` `)
    );
    row?.setAttribute(`tabindex`, `-1`);
    item.querySelector(`:scope > ul`)?.setAttribute(`role`, `group`);
  }
};

const upgrade = (tree: HTMLElement): void => {
  if (upgraded.has(tree)) return;
  upgraded.add(tree);
  tree.setAttribute(`role`, `tree`);
  if (!tree.hasAttribute(`aria-label`) && !tree.hasAttribute(`aria-labelledby`))
    tree.setAttribute(`aria-label`, `Files`);
  label(tree);
  tree.addEventListener(`keydown`, (event) => onKey(tree, event));
  // A click on a row makes its item the one focused.
  tree.addEventListener(`click`, (event) => {
    const item =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(ITEM)
        : null;
    if (item && tree.contains(item)) focus(tree, item);
  });
  // The toggle event doesn't bubble: catch it on its way down to each <details>.
  tree.addEventListener(
    `toggle`,
    (event) => {
      const folder = event.target;
      if (!(folder instanceof HTMLDetailsElement) || !tree.contains(folder))
        return;
      folder.setAttribute(`aria-expanded`, String(folder.open));
      // Focus inside a folder that closed moves to the folder.
      const active = document.activeElement;
      if (!folder.open && active !== folder && folder.contains(active))
        focus(tree, folder);
    },
    { capture: true }
  );
};

const upgradeAll = (root: ParentNode): void => {
  for (const tree of root.querySelectorAll<HTMLElement>(TREE)) upgrade(tree);
};

upgradeAll(document);
new MutationObserver((records) => {
  for (const record of records)
    for (const node of record.addedNodes)
      if (node instanceof HTMLElement) {
        if (node.matches(TREE)) upgrade(node);
        else upgradeAll(node);
      }
}).observe(document.documentElement, { childList: true, subtree: true });

// A module, so its names stay out of the global scope.
export {};
