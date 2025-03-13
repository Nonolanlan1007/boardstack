import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";

const paramsSchema = z.object({
  boardId: z.string(),
  labelId: z.string(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, labelId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const user = await auth.user(event);

  if (!user)
    throw createError({
      statusCode: 401,
    });

  const board = await prisma.boards.findFirst({
    where: { id: boardId },
    include: {
      members: {
        select: {
          user_id: true,
          role: true,
        },
      },
    },
  });

  if (!board)
    throw createError({
      statusCode: 404,
      message: "Board not found",
    });

  if (
    board.owner_id !== user.id &&
    !board.members.find(
      (member) => member.user_id === user.id && member.role !== "reader",
    )
  )
    throw createError({
      statusCode: 403,
    });

  const label = await prisma.board_labels.findFirst({
    where: { id: labelId },
  });

  if (!label)
    throw createError({
      statusCode: 404,
      message: "Label not found",
    });

  await prisma.board_labels.delete({
    where: { id: labelId },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "label_deleted",
      data: labelId,
    }),
  );

  return "OK";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Delete a label",
    description: "Delete a label",
    operationId: "deleteLabel",
    responses: {
      "200": {
        description: "Label deleted",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              example: "OK",
            },
          },
        },
      },
      "403": {
        description: "User is not allowed to update this board",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              example: "Forbidden",
            },
          },
        },
      },
    },
  },
});
