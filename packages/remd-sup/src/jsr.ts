// JSR entrypoint: the plugin only. The mdast augmentation (augment.ts) is
// deliberately not imported here — JSR rejects module augmentation, so JSR
// consumers get the constrained-but-valid type subset. npm keeps the full
// augmented types via index.ts.
export * from "./plugin";
