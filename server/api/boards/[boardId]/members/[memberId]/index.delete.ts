import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";

const paramsSchema = z.object({
  boardId: z.string(),
  memberId: z.string(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, memberId } = await getValidatedRouterParams(
    event,
    (params) => paramsSchema.parse(params),
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
      (member) => member.user_id === user.id && member.role === "admin",
    )
  )
    throw createError({
      statusCode: 403,
    });

  const member = await prisma.board_members.findFirst({
    where: { parent_board: boardId, id: memberId },
  });

  if (!member)
    throw createError({
      statusCode: 404,
      message: "Member not found",
    });

  await prisma.board_members.delete({
    where: { parent_board: boardId, id: memberId },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "member_deleted",
      data: member.id,
    }),
  );

  return "Member deleted";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Delete member",
    description: "Kick a member from the current board",
    operationId: "deleteBoardMember",
    responses: {
      "200": {
        description: "Member successfully deleted",
      },
    },
  },
});
