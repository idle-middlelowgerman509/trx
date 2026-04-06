import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const changelog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/changelog" }),
	schema: z.object({
		version: z.string(),
		date: z.string(),
		title: z.string(),
	}),
});

const docs = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		order: z.number().default(0),
	}),
});

export const collections = { changelog, docs };
