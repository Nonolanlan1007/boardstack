import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";

const paramsSchema = z.object({
  boardId: z.string(),
});

const bodySchema = z.object({
  label: z.string().max(20),
  color: z.string().regex(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId } = await getValidatedRouterParams(event, (params) =>
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

  const newLabel = await prisma.board_labels.create({
    data: {
      id: uuid(),
      label: body.label,
      color: "#" + body.color,
      created_by: user.id,
      parent_board: boardId,
    },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "label_created",
      data: newLabel,
    }),
  );

  return "OK";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Create a label",
    description: "Create a label and link it to a board",
    operationId: "createLabel",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            required: ["label", "color"],
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
                example: "FF0000",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Label created",
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
