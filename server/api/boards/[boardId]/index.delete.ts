import prisma from "~/lib/prisma";
import { z } from "zod";

const paramsSchema = z.object({
  boardId: z.string(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const user = await auth.user(event);

  if (!user)
    throw createError({
      statusCode: 401,
    });

  const board = await prisma.boards.findFirst({
    where: { id: boardId },
  });

  if (!board)
    throw createError({
      statusCode: 404,
      message: "Board not found",
    });

  if (board.owner_id !== user.id)
    throw createError({
      statusCode: 403,
    });

  await prisma.boards.delete({
    where: { id: boardId },
  });

  return "Board deleted";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Delete board",
    description: "Delete a board",
    operationId: "deleteBoard",
    responses: {
      "200": {
        description: "Board successfully deleted",
      },
    },
  },
});
