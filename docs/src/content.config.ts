import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const plugins = defineCollection({
  loader: glob({ pattern: "*/index.md", base: "./public/plugins" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { plugins };
