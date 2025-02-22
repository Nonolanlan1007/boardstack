import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";

const paramsSchema = z.object({
  boardId: z.string(),
  invitationId: z.string(),
});

const bodySchema = z.object({
  role: z.enum(["reader", "member", "admin"]),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, invitationId } = await getValidatedRouterParams(
    event,
    (params) => paramsSchema.parse(params),
  );

  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

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

  const invitation = await prisma.board_invitations.findFirst({
    where: { parent_board: boardId, id: invitationId },
  });

  if (!invitation)
    throw createError({
      statusCode: 404,
      message: "Invitation not found",
    });

  const newInvite = await prisma.board_invitations.update({
    where: { parent_board: boardId, id: invitationId },
    data: {
      role: body.role,
    },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "invitation_updated",
      data: { ...newInvite, avatar: getGravatar(invitation.email) },
    }),
  );

  return "Invitation updated";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Update invitation",
    description: "Update the role associated to an invitation",
    operationId: "updateBoardInvite",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              role: {
                type: "string",
                enum: ["reader", "member", "admin"],
                description: "The new role of the invitation",
                example: "reader",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Invitation successfully updated",
      },
    },
  },
});
