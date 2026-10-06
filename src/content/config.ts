import { defineCollection, z } from 'astro:content';

const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    videoId: z.string(),
    tags: z.array(z.string()).default(['Genshin Impact']),
    draft: z.boolean().default(true),
  }),
});

export const collections = {
  articles: articlesCollection,
};
