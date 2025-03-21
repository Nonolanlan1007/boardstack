import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";

const paramsSchema = z.object({
  boardId: z.string(),
  memberId: z.string(),
});

const bodySchema = z.object({
  role: z.enum(["reader", "member", "admin"]),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, memberId } = await getValidatedRouterParams(
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

  const member = await prisma.board_members.findFirst({
    where: { parent_board: boardId, id: memberId },
  });

  if (!member)
    throw createError({
      statusCode: 404,
      message: "Invitation not found",
    });

  if (member.user_id === user.id)
    throw createError({
      statusCode: 403,
    });

  const newMember = await prisma.board_members.update({
    where: { parent_board: boardId, id: memberId },
    data: {
      role: body.role,
    },
    include: {
      users: {
        select: {
          full_name: true,
          email: true,
        },
      },
    },
  });

  await prisma.activity_logs.create({
    data: {
      id: uuid(),
      parent_board_id: boardId,
      action: "member_role_updated",
      created_by: user.id,
      old_value: member.role,
      new_value: newMember.role,
      linked_value: newMember.user_id,
    },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "member_updated",
      data: {
        ...newMember,
        users: undefined,
        full_name: newMember.users!.full_name,
        avatar: getGravatar(newMember.users!.email),
        email: newMember.users!.email,
      },
    }),
  );

  return "Member updated";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Update member",
    description: "Update the role associated to a member",
    operationId: "updateBoardMember",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              role: {
                type: "string",
                enum: ["reader", "member", "admin"],
                description: "The new role of the member",
                example: "reader",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Member successfully updated",
      },
    },
  },
});
