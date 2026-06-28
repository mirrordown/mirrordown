// markdown-it block state subclassing requires casting state.constructor; no narrower type exists.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { PluginWithOptions } from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type { TabFrame, TabsBlock, TabsOptions } from "./types.js";
import {
  parseTabHeader,
  stripContinuation,
  stripAttrs,
  groupId,
  blockId,
  CONTINUATION_RE
} from "./utils.js";

export type { TabsOptions };

/** markdown-it plugin for tabbed content blocks. */
export const tabs: PluginWithOptions<TabsOptions> = (md, options = {}) => {
  const { containerClass = "markdown-tabs" } = options;

  md.block.ruler.before("blockquote", "tabs", tabsRule, {
    alt: ["paragraph", "reference"]
  });

  function tabsRule(
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const lineText = state.src.slice(pos, max);

    // Must start with a depth-1 tab header
    const firstHeader = parseTabHeader(lineText);
    if (!firstHeader) return false;
    if (firstHeader.depth !== 1) return false;

    if (silent) return true;

    const block: TabsBlock = { frames: [], currentDepth: 0 };
    let currentFrame: TabFrame | null = null;
    let nextLine = startLine;

    const flushFrame = (): void => {
      if (currentFrame) block.frames.push(currentFrame);
      currentFrame = null;
    };

    while (nextLine < endLine) {
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      const line = state.src.slice(linePos, lineMax);

      const header = parseTabHeader(line);
      if (header) {
        const { depth } = header;

        // No depth jumps greater than +1
        if (depth > block.currentDepth + 1) break;

        flushFrame();
        block.currentDepth = depth;
        currentFrame = {
          depth,
          label: header.label,
          open: header.open,
          bodyLines: []
        };
        nextLine++;
        continue;
      }

      if (currentFrame !== null) {
        // Blank line â€” tabs are adjacent so blank terminates the block
        if (state.isEmpty(nextLine)) break;

        // Bare > is a blank continuation line within the panel body
        if (line === ">") {
          currentFrame.bodyLines.push("");
          nextLine++;
          continue;
        }

        if (CONTINUATION_RE.test(line)) {
          currentFrame.bodyLines.push(stripContinuation(line));
          nextLine++;
          continue;
        }
      }

      // Line is neither a header nor a continuation â€” block ends
      break;
    }

    flushFrame();

    if (block.frames.length === 0) return false;

    state.line = nextLine;

    emitTabsTokens(
      state,
      block.frames,
      startLine,
      nextLine - 1,
      containerClass
    );

    return true;
  }

  function emitTabsTokens(
    state: StateBlock,
    frames: TabFrame[],
    startLine: number,
    endLine: number,
    containerClass: string
  ): void {
    emitFrames(state, frames, 0, containerClass, startLine, endLine);
  }

  function emitFrames(
    state: StateBlock,
    frames: TabFrame[],
    parentDepth: number,
    containerClass: string,
    mapStart?: number,
    mapEnd?: number
  ): void {
    const targetDepth = parentDepth + 1;

    let i = 0;
    while (i < frames.length) {
      const frame = frames[i];
      if (frame.depth !== targetDepth) {
        i++;
        continue;
      }

      // Collect all frames at targetDepth and deeper until depth drops back
      const group: TabFrame[] = [];
      let j = i;
      while (j < frames.length) {
        if (frames[j].depth < targetDepth) break;
        group.push(frames[j]);
        j++;
      }

      // Compute ids from the labels at this depth level
      const depthLabels = group
        .filter((f) => f.depth === targetDepth)
        .map((f) => f.label);
      const gId = groupId(depthLabels);
      const bId = blockId(mapStart ?? 0, gId);

      // Determine which tab is open: first explicit %+, else first tab
      const explicitOpenIdx = group.findIndex(
        (f) => f.depth === targetDepth && f.open
      );

      // Emit container <div>
      const divOpen = state.push("tabs_open", "div", 1);
      divOpen.attrSet("class", containerClass);
      divOpen.attrSet("data-tabs-group", gId);
      if (mapStart !== undefined && mapEnd !== undefined)
        divOpen.map = [mapStart, mapEnd];
      divOpen.block = true;
      divOpen.meta = { attrsRole: "container" };

      // Emit <div class="...-labels"> containing all radio inputs + labels
      const labelsOpen = state.push("tabs_labels_open", "div", 1);
      labelsOpen.attrSet("class", `${containerClass}-labels`);
      labelsOpen.block = true;

      let labelK = 0;
      let labelIdx = 0;
      while (labelK < group.length) {
        const f = group[labelK];
        if (f.depth !== targetDepth) {
          labelK++;
          continue;
        }
        const isOpen =
          explicitOpenIdx >= 0 ? labelK === explicitOpenIdx : labelIdx === 0;
        const inputId = `${bId}-${labelIdx}`;

        // <input type="radio">
        const inputTok = state.push("tab_input", "input", 0);
        inputTok.attrSet("type", "radio");
        inputTok.attrSet("name", bId);
        inputTok.attrSet("id", inputId);
        inputTok.attrSet("hidden", "");
        if (isOpen) inputTok.attrSet("checked", "");

        // <label>
        const labelOpen = state.push("tab_label_open", "label", 1);
        labelOpen.attrSet("class", `${containerClass}-label`);
        labelOpen.attrSet("for", inputId);
        labelOpen.meta = { attrsRole: "containerItem", attrsItemTitle: true };

        const labelInline = state.push("inline", "", 0);
        labelInline.content = f.label;
        labelInline.children = [];

        state.push("tab_label_close", "label", -1);

        // Find child frames for this tab (needed later for panels)
        const childStart = labelK + 1;
        let childEnd = childStart;
        while (childEnd < group.length && group[childEnd].depth > targetDepth)
          childEnd++;

        labelIdx++;
        labelK = childEnd;
      }

      state.push("tabs_labels_close", "div", -1);

      // Emit <div class="...-panels"> containing all sections
      const panelsOpen = state.push("tabs_panels_open", "div", 1);
      panelsOpen.attrSet("class", `${containerClass}-panels`);
      panelsOpen.block = true;

      let panelK = 0;
      while (panelK < group.length) {
        const f = group[panelK];
        if (f.depth !== targetDepth) {
          panelK++;
          continue;
        }

        const labelPlain = stripAttrs(
          md.renderInline(f.label).replace(/<[^>]+>/g, "")
        );

        // Find child frames
        const childStart = panelK + 1;
        let childEnd = childStart;
        while (childEnd < group.length && group[childEnd].depth > targetDepth)
          childEnd++;
        const children = group.slice(childStart, childEnd);

        // <section>
        const sectionOpen = state.push("tab_panel_open", "section", 1);
        sectionOpen.attrSet("class", `${containerClass}-panel`);
        sectionOpen.attrSet("aria-label", labelPlain);
        sectionOpen.block = true;

        // Tokenize panel body
        if (f.bodyLines.length > 0) {
          const bodyContent = f.bodyLines.join("\n");
          const oldParentType = state.parentType;
          state.parentType = "blockquote" as typeof state.parentType;
          const oldLineMax = state.lineMax;

          const childState = new (state.constructor as typeof StateBlock)(
            bodyContent,
            state.md,
            state.env,
            state.tokens
          );
          childState.md.block.tokenize(childState, 0, childState.lineMax);

          state.parentType = oldParentType;
          state.lineMax = oldLineMax;
        }

        // Nested tabs within this panel
        if (children.length > 0) {
          emitFrames(state, children, targetDepth, containerClass);
        }

        state.push("tab_panel_close", "section", -1);

        panelK = childEnd;
      }

      state.push("tabs_panels_close", "div", -1);

      const divClose = state.push("tabs_close", "div", -1);
      divClose.block = true;
      divClose.meta = { attrsRole: "container" };

      i = j;
    }
  }
};
