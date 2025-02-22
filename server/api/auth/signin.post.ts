import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  await auth.attempt(event, body.email, body.password);
});
