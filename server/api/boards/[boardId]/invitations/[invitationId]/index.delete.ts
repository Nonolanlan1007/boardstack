import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";

const paramsSchema = z.object({
  boardId: z.string(),
  invitationId: z.string(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, invitationId } = await getValidatedRouterParams(
    event,
    (params) => paramsSchema.parse(params),
  );

  const user = await auth.user(event);

  if (!user)
    throw createError({
      statusCode: 401,
    });

  const invitation = await prisma.board_invitations.findFirst({
    where: { parent_board: boardId, id: invitationId },
  });

  if (!invitation)
    throw createError({
      statusCode: 404,
      message: "Invitation not found",
    });

  if (user.email !== invitation.email) {
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
  }

  await prisma.board_invitations.delete({
    where: { parent_board: boardId, id: invitationId },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "invitation_deleted",
      data: invitation.id,
    }),
  );

  return "Invitation deleted";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Delete invitation",
    description: "Delete a previously created invitation",
    operationId: "deleteBoardInvite",
    responses: {
      "200": {
        description: "Invitation successfully deleted",
      },
    },
  },
});
