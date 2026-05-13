import { defineConfig } from "astro/config";
import { remarkAbbr } from "@saeris/remd-abbr";
import { remarkAttrs } from "@saeris/remd-attrs";
import { remarkDefinitionList, defListHastHandlers } from "@saeris/remd-definition-list";
import { remarkDel } from "@saeris/remd-del";
import { remarkGithubAlerts } from "@saeris/remd-github-alerts";
import { remarkIns } from "@saeris/remd-ins";
import { remarkKbd } from "@saeris/remd-kbd";
import { remarkMark } from "@saeris/remd-mark";
import { remarkRuby } from "@saeris/remd-ruby";
import { remarkSteps, stepsHastHandlers } from "@saeris/remd-steps";
import { remarkSub } from "@saeris/remd-sub";
import { remarkSup } from "@saeris/remd-sup";
import { remarkTabs, tabsHastHandlers } from "@saeris/remd-tabs";
import { rehypeInlineSvg } from "@saeris/remd-inline-svg";
import { rehypeUnwrapImages } from "@saeris/remd-unwrap-images";

export default defineConfig({
  integrations: [],
  markdown: {
    remarkPlugins: [
      remarkAbbr,
      remarkAttrs,
      remarkDefinitionList,
      remarkDel,
      remarkGithubAlerts,
      remarkIns,
      remarkKbd,
      remarkMark,
      remarkRuby,
      remarkSteps,
      remarkSub,
      remarkSup,
      remarkTabs,
    ],
    rehypePlugins: [rehypeInlineSvg, rehypeUnwrapImages],
    remarkRehype: {
      handlers: {
        ...defListHastHandlers,
        ...stepsHastHandlers,
        ...tabsHastHandlers,
      },
    },
  },
});
