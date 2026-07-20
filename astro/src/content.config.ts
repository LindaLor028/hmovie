import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const movies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/movies" }),
  schema: z.object({
    title: z.string(),
    permalink: z.string(),
    thumbnail: z.string(),
    year: z.string(),
    synopsis: z.string().default(""),
    producer: z.string().default(""),
    director: z.string().default(""),
    writer: z.string().default(""),
    video_link: z.string().default(""),
    genre: z.string().default(""),
    release_type: z.string().default(""),
    storage: z.string().default(""),
    publishing_company: z.string().default(""),
    base_movie: z.string().default(""),
    sequel: z.string().default(""),
    total_parts: z.number().nullable().optional(),
    cast: z.array(z.object({ name: z.string() })).default([]),
    featured: z.boolean().default(false),
  }),
});

const actors = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/actors" }),
  schema: z.object({
    title: z.string(),
    permalink: z.string(),
    thumbnail: z.string(),
    display_name: z.string().optional(),
  }),
});

export const collections = { movies, actors };
