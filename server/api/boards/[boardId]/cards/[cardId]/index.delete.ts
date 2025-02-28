import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";

const paramsSchema = z.object({
  boardId: z.string(),
  cardId: z.string(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, cardId } = await getValidatedRouterParams(event, (params) =>
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

  const card = await prisma.board_cards.findFirst({
    where: { id: cardId },
    include: {
      labels: {
        select: {
          label_id: true,
        },
      },
    },
  });

  if (!card)
    throw createError({
      statusCode: 404,
      message: "Card not found",
    });

  await prisma.board_cards.delete({
    where: { id: cardId },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "card_deleted",
      data: { id: cardId, parent_list: card.parent_list },
    }),
  );

  return "Card deleted";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Delete card",
    description: "Delete a card",
    operationId: "deleteBoardCard",
    responses: {
      "200": {
        description: "Card successfully deleted",
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
