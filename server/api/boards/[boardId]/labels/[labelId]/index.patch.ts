import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";

const paramsSchema = z.object({
  boardId: z.string(),
  labelId: z.string(),
});

const bodySchema = z.object({
  label: z.string().max(20).optional(),
  color: z
    .string()
    .regex(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i)
    .optional(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, labelId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  if (!body.label && !body.color)
    throw createError({
      statusCode: 400,
      message: "One of the following fields are required: `label` or `color`",
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

  const newLabel = await prisma.board_labels.update({
    where: { id: labelId },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.color !== undefined && { color: "#" + body.color }),
    },
  });

  if (newLabel.label !== label.label)
    await prisma.activity_logs.create({
      data: {
        id: uuid(),
        parent_board_id: boardId,
        action: "label_label_updated",
        created_by: user.id,
        old_value: label.label,
        new_value: newLabel.label,
        linked_value: newLabel.id,
      },
    });

  if (newLabel.color !== label.color)
    await prisma.activity_logs.create({
      data: {
        id: uuid(),
        parent_board_id: boardId,
        action: "label_color_updated",
        created_by: user.id,
        old_value: label.color,
        new_value: newLabel.color,
        linked_value: newLabel.id,
      },
    });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "label_updated",
      data: newLabel,
    }),
  );

  return "OK";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Update a label",
    description: "Update a label",
    operationId: "updateLabel",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              label: {
                type: "string",
                title: "Label",
                description: "The title of the label",
                example: "Bug",
              },
              color: {
                type: "string",
                title: "Color",
                description: "The color of the label in hexa",
                example: "#FF0000",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Label updated",
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
