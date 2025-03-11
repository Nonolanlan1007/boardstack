import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";
import type { activity_logsCreateManyInput } from "@prisma/client";

const paramsSchema = z.object({
  boardId: z.string(),
});

const bodySchema = z.object({
  title: z.string().trim().max(50).optional(),
  description: z.string().trim().nullable().optional(),
  background: z.string().optional(),
  background_type: z.string().optional(),
  background_credits: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  if (
    body.title === undefined &&
    body.description === undefined &&
    body.background === undefined
  )
    throw createError({
      status: 400,
      message:
        "One of the following fields are required: `title`, `background` or `description`",
    });

  if (body.background && body.background_type === undefined)
    throw createError({
      status: 400,
      message:
        "When using `background` field, `background_type` field is required",
    });

  if (body.background_type === "image" && body.background_credits === undefined)
    throw createError({
      status: 400,
      message:
        "When using `background_type` field with value `image`, `background_credits` field is required",
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
      (member) => member.user_id === user.id && member.role == "admin",
    )
  )
    throw createError({
      statusCode: 403,
    });

  const newBoard = await prisma.boards.update({
    where: { id: boardId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.background !== undefined && { background: body.background }),
      ...(body.background_type !== undefined && {
        background_type: body.background_type as "color" | "image",
      }),
      ...(body.background_credits !== undefined && {
        background_credits: body.background_credits,
      }),
    },
  });

  const actions: Omit<
    activity_logsCreateManyInput,
    "id" | "parent_board_id" | "created_by"
  >[] = [];

  if (board.title !== newBoard.title)
    actions.push({
      action: "rename_board",
      old_value: board.title,
      new_value: newBoard.title,
    });

  if (board.description !== newBoard.description)
    actions.push({
      action: "update_board_description",
    });

  if (board.background !== newBoard.background)
    actions.push({
      action: "update_board_background",
      old_value: board.background,
      new_value: newBoard.background,
    });

  await prisma.activity_logs.createMany({
    data: actions.map((action) => ({
      ...action,
      id: uuid(),
      parent_board_id: boardId,
      created_by: user.id,
    })) as activity_logsCreateManyInput[],
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({ type: "board_updated", data: newBoard }),
  );

  return "OK";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Update board",
    description: "Update a board",
    operationId: "updateBoard",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title of the board",
                example: "My awesome board",
              },
              description: {
                type: "string",
                description: "The description of the board",
                example: "This board is made for...",
                nullable: true,
              },
              background: {
                type: "string",
                description: "The background of the board",
                example: "black",
              },
              background_type: {
                type: "string",
                description: "The type of background",
                enum: ["color", "image"],
              },
              background_credits: {
                type: "string",
                description:
                  "The background credits (if background is an Unsplash image)",
                example:
                  "Lucas K,https://unsplash.com/photos/blue-and-orange-smoke-wQLAGv4_OYs",
                nullable: true,
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Board successfully updated",
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
      "400": {
        description: "Body is required",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              example:
                "One of the following fields are required: `label` or `color`",
            },
          },
        },
      },
    },
  },
});
