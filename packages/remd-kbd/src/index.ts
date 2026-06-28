// npm entrypoint: plugin + mdast augmentation, so the published .d.ts ships
// fully-typed kbd nodes. JSR uses jsr.ts (no augmentation) — see jsr.json.
import "./augment";

export * from "./plugin";
