import type { H3Event } from "h3";
import bcrypt from "bcrypt";
import prisma from "~/lib/prisma";
import type { users } from "@prisma/client";

async function login(event: H3Event<Request>, userId: string) {
  await replaceUserSession(event, {
    user: {
      id: userId,
    },
    loggedInAt: new Date(),
  });
}

async function getCurrentUser(
  event: H3Event<Request>,
): Promise<Omit<users, "password"> | null> {
  const session = await getUserSession(event);

  if (!session.user) {
    return null;
  }

  const res = await prisma.users.findFirst({
    where: { id: session.user.id },
    omit: { password: true },
  });

  if (!res) return null;

  return { ...res };
}

async function attempt(
  event: H3Event<Request>,
  email: string,
  password: string,
) {
  const foundUser = await prisma.users.findFirst({
    where: { email },
    select: {
      id: true,
      password: true,
    },
  });

  if (!foundUser || !bcrypt.compareSync(password, foundUser.password)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  await login(event, foundUser.id);

  return true;
}

export default {
  login,
  user: getCurrentUser,
  attempt,
};
