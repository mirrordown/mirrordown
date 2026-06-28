// npm entrypoint: the plugin plus the mdast augmentation, so the published
// .d.ts ships fully-typed mdast nodes. JSR uses jsr.ts (no augmentation)
// instead — see jsr.json — because JSR rejects module augmentation.
import "./augment";

export * from "./plugin";
