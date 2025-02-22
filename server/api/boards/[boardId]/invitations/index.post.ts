import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";
import Mailer from "~/server/utils/Mailer";

const paramsSchema = z.object({
  boardId: z.string(),
});

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["reader", "member", "admin"]),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_SECURE ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  )
    throw createError({
      statusCode: 503,
      message:
        "Mail service is not configured. Please update your env configuration and try again.",
    });

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

  const currentInvite = await prisma.board_invitations.findFirst({
    where: { parent_board: boardId, email: body.email },
  });
  if (currentInvite)
    return createError({
      statusCode: 400,
      message: "Invitation already exists",
    });

  const invitation = await prisma.board_invitations.create({
    data: {
      id: uuid(),
      email: body.email,
      parent_board: boardId,
      created_by: user.id,
      role: body.role,
    },
  });

  const mailer = new Mailer(body.email);
  await mailer.sendMessage(
    "board_invitation",
    {
      user: user.full_name,
      boardName: board.title,
      role: body.role,
      permissions:
        body.role === "reader"
          ? "view"
          : body.role === "member"
            ? "view and edit"
            : "view, edit and manage",
      host: getHeader(event, "host")!,
      invitationId: invitation.id,
    },
    true,
  );

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "invitation_created",
      data: { ...invitation, avatar: getGravatar(body.email) },
    }),
  );

  return invitation;
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Create invitation",
    description: "Invite someone in a board",
    operationId: "createBoardInvite",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email"],
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "The email address of the user you want to invite",
                example: "john.doe@boardstack.app",
              },
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
        description: "Invitation successfully sent",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  description: "The id of the invitation",
                  example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                },
                email: {
                  type: "string",
                  description: "The email address of the invited user",
                  example: "john.doe@boardstack.app",
                },
                role: {
                  type: "string",
                  enum: ["reader", "member", "admin"],
                  description: "The new role of the invitation",
                  example: "reader",
                },
                created_by: {
                  type: "string",
                  format: "uuid",
                  description: "The user who created this invitation",
                  example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                },
                parent_board: {
                  type: "string",
                  format: "uuid",
                  description: "The parent board",
                  example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                },
                created_at: {
                  type: "string",
                  description: "The date the invitation was created",
                  example: "2025-02-09T09:26:10.570Z",
                },
                updated_at: {
                  type: "string",
                  description: "The date the invitation was updated",
                  example: "2025-02-09T09:26:10.570Z",
                },
              },
            },
          },
        },
      },
      "400": {
        description:
          "An invitation already exists for this user. You need to delete and recreate it to resend the email.",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              example: "Invitation already exists",
            },
          },
        },
      },
    },
  },
});
