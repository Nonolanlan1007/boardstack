import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";

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

  if (invitation.email !== user.email)
    throw createError({
      statusCode: 403,
    });

  const board = await prisma.boards.findFirst({
    where: { id: boardId },
  });

  if (!board)
    throw createError({
      statusCode: 404,
      message: "Board not found",
    });

  const member = await prisma.board_members.create({
    data: {
      id: uuid(),
      parent_board: boardId,
      user_id: user.id,
      role: invitation.role,
    },
    include: {
      users: {
        select: {
          full_name: true,
          email: true,
        },
      },
    },
    omit: {
      id: true,
    },
  });

  await prisma.board_invitations.delete({
    where: { parent_board: boardId, id: invitationId },
  });

  await prisma.activity_logs.create({
    data: {
      id: uuid(),
      parent_board_id: boardId,
      action: "invitation_accepted",
      created_by: user.id,
    },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "member_created",
      data: {
        ...member,
        users: undefined,
        full_name: member.users!.full_name,
        avatar: getGravatar(member.users!.email),
        email: member.users!.email,
      },
    }),
  );

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "invitation_deleted",
      data: invitation.id,
    }),
  );

  return "Invitation accepted";
});
