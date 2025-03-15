import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import { v4 as uuid } from "uuid";

const paramsSchema = z.object({
  boardId: z.string(),
});

const bodySchema = z.object({
  title: z.string().trim().max(50),
  parentBoard: z.string(),
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

  const lastList = await prisma.board_lists.findFirst({
    where: { parent_board: body.parentBoard },
    orderBy: {
      position: "desc",
    },
  });

  const listId = uuid();

  const newList = await prisma.board_lists.create({
    data: {
      id: listId,
      title: body.title,
      parent_board: body.parentBoard,
      position: lastList ? lastList.position + 1 : 0,
      created_by: user.id,
    },
  });

  await prisma.activity_logs.create({
    data: {
      id: uuid(),
      parent_board_id: boardId,
      action: "list_created",
      created_by: user.id,
      new_value: newList.title,
      linked_value: newList.id,
    },
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({ type: "list_created", data: newList }),
  );

  setResponseStatus(event, 201);

  return "OK";
});

defineRouteMeta({
  openAPI: {
    tags: ["Lists"],
    summary: "Create list",
    description: "Create a new list",
    operationId: "createList",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["title", "parentBoard"],
            properties: {
              title: {
                type: "string",
                description: "The title of the card",
                example: "My awesome card",
              },
              parentBoard: {
                type: "string",
                format: "uuid",
                description: "The id of the parent board",
                example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "List successfully created",
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
