import type MarkdownIt from "markdown-it";
import { githubAlerts } from "@saeris/mdit-github-alerts";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(githubAlerts),
});
