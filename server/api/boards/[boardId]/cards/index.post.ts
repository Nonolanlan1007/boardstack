import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";

const paramsSchema = z.object({
  boardId: z.string(),
});

const bodySchema = z.object({
  title: z.string().trim().max(50),
  description: z.string().trim().nullable(),
  parentList: z.string(),
  labels: z.array(z.string()).optional(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
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
      (member) => member.user_id === user.id && member.role !== "reader",
    )
  )
    throw createError({
      statusCode: 403,
    });

  const lastCard = await prisma.board_cards.findFirst({
    where: { parent_list: body.parentList },
    orderBy: {
      position: "desc",
    },
  });

  const cardId = uuid();

  const newCard = await prisma.board_cards.create({
    data: {
      id: cardId,
      title: body.title,
      description: body.description,
      parent_list: body.parentList,
      position: lastCard ? lastCard.position + 1 : 0,
      ...(body.labels
        ? {
            labels: {
              create: body.labels.map((label) => ({
                label_id: label,
              })),
            },
          }
        : {}),
      created_by: user.id,
    },
    include: {
      labels: {
        select: {
          label_id: true,
        },
      },
    },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({ type: "card_created", data: newCard }),
  );

  setResponseStatus(event, 201);

  return "OK";
});

defineRouteMeta({
  openAPI: {
    tags: ["Cards"],
    summary: "Create card",
    description: "Create a new card and link it to a list",
    operationId: "createCard",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["title", "description", "parentList"],
            properties: {
              title: {
                type: "string",
                description: "The title of the card",
                example: "My awesome card",
              },
              description: {
                type: "string",
                description: "The description of the card",
                example: "Cool card!",
                nullable: true,
              },
              parentList: {
                type: "string",
                format: "uuid",
                description: "The id of the parent list",
                example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
              },
              labels: {
                type: "array",
                description: "Labels associated to this card",
                items: {
                  type: "string",
                  format: "uuid",
                  description: "The id of the label",
                  example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                },
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Card successfully created",
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
