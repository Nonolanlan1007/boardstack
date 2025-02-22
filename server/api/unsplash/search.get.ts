import type { boards } from "@prisma/client";
import z from "zod";
import env from "~/env"

const querySchema = z.object({
  q: z.string(),
});

export default defineEventHandler(async (event): Promise<boards[]> => {
  await requireUserSession(event, { statusCode: 401 });

  const user = await auth.user(event);

  if (!user)
    throw createError({
      statusCode: 401,
    });

  const { q } = await getValidatedQuery(event, (query) =>
    querySchema.parse(query),
  );

  if (!env.get("UNSPLASH_SECRET_KEY"))
    throw createError({
      statusCode: 503,
      message:
        "Unsplash service is not configured. Please fill the `UNSPLASH_SECRET_KEY` environment variable with your Unsplash secret key.",
    });

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=1&per_page=30&orientation=landscape`,
    {
      headers: {
        Authorization: `Authorization: Client-ID ${process.env.UNSPLASH_SECRET_KEY}`,
      },
    },
  );

  return await res.json();
});
