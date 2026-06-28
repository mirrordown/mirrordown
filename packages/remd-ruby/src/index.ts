// npm entrypoint: plugin + micromark/mdast augmentation, so the published .d.ts
// ships fully-typed ruby nodes. JSR uses jsr.ts (no augmentation) — see jsr.json.
import "./augment";

export * from "./plugin";
