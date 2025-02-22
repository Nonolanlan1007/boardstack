import prisma from "~/lib/prisma";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import { z } from "zod";
import env from "~/env";

const bodySchema = z.object({
  email: z.string().email(),
  full_name: z.string(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  if (!env.get("ENABLE_REGISTRATION"))
    throw createError({
      statusCode: 503,
      message:
        "Your administrator has disabled registrations on this instance. You can enable them by setting the `ENABLE_REGISTRATION` environment variable to `true`",
    });

  const passwordHash = bcrypt.hashSync(body.password, 12);

  const user = await prisma.users.create({
    data: {
      id: uuid(),
      full_name: body.full_name,
      password: passwordHash,
      email: body.email,
    },
    select: {
      id: true,
    },
  });

  await auth.login(event, user.id);
});
