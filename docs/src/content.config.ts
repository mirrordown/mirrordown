import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./public" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    root: z.boolean().optional(),
  }),
});

export const collections = { docs };
