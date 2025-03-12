import z from "zod";
import prisma from "~/lib/prisma";

const paramsSchema = z.object({
  boardId: z.string(),
});

const queryValidator = z.object({
  start: z.string().optional(),
  count: z.string().optional(),
  created_by: z.string().optional(),
  action: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const query = await getValidatedQuery(event, (query) =>
    queryValidator.parse(query),
  );

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
    !board.members.find((member) => member.user_id === user.id)
  )
    throw createError({
      statusCode: 403,
    });

  const logs = await prisma.activity_logs.findMany({
    where: {
      parent_board_id: boardId,
      action: query.action,
      created_by: query.created_by,
    },
    skip: Number(query.start) || 0,
    take: Number(query.count) || 10,
    orderBy: {
      created_at: "desc",
    },
    include: {
      user: {
        select: {
          full_name: true,
          email: true,
        },
      },
    },
  });

  return {
    total: await prisma.activity_logs.count({
      where: {
        parent_board_id: boardId,
        action: query.action,
        created_by: query.created_by,
      },
    }),
    logs: logs.map((log) => ({
      ...log,
      user: undefined,
      full_name: log.user.full_name,
      avatar: getGravatar(log.user.email),
    })),
  };
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Get board activity logs",
    description: "Get activity logs for a specified board",
    operationId: "getBoardLogs",
    parameters: [
      {
        name: "start",
        in: "query",
        description: "The starting index of the logs to fetch",
        required: false,
        schema: {
          type: "integer",
          example: 0,
        },
      },
      {
        name: "count",
        in: "query",
        description: "The number of logs to fetch",
        required: false,
        schema: {
          type: "integer",
          example: 10,
        },
      },
      {
        name: "created_by",
        in: "query",
        description: "Filter logs by the user who created them",
        required: false,
        schema: {
          type: "string",
          format: "uuid",
          example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
        },
      },
      {
        name: "action",
        in: "query",
        description: "Filter logs by action type",
        required: false,
        schema: {
          type: "string",
          example: "renamed_board",
        },
      },
    ],
    responses: {
      "200": {
        description: "Activity logs successfully fetched",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    format: "uuid",
                    description: "The id of the log",
                    example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                  },
                  parent_board_id: {
                    type: "string",
                    format: "uuid",
                    nullable: true,
                    description: "The id of the parent board",
                    example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                  },
                  parent_card_id: {
                    type: "string",
                    format: "uuid",
                    nullable: true,
                    description: "The id of the parent card",
                    example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                  },
                  action: {
                    type: "string",
                    description: "The action associated with the log",
                    example: "renamed_board",
                  },
                  created_by: {
                    type: "string",
                    format: "uuid",
                    description:
                      "The id of the user that did the associated action",
                    example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                  },
                  old_value: {
                    type: "string",
                    nullable: true,
                    description: "The old value",
                    example: "Old title of the board",
                  },
                  new_value: {
                    type: "string",
                    nullable: true,
                    description: "The new value",
                    example: "New title of the board",
                  },
                  linked_value: {
                    type: "string",
                    nullable: true,
                    description: "Something that is linked to the log",
                    example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                  },
                  full_name: {
                    type: "string",
                    description:
                      "The name of the user that done the associtated action",
                    example: "John Doe",
                  },
                  avatar: {
                    type: "string",
                    description:
                      "The avatar of the user that done the associtated action",
                    example:
                      "https://www.gravatar.com/avatar/d5e...d9a?size=256&d=identicon",
                  },
                  created_at: {
                    type: "string",
                    description: "The date the entry was created",
                    example: "2025-02-09T09:26:10.570Z",
                  },
                  updated_at: {
                    type: "string",
                    description: "The date the entry was updated",
                    example: "2025-02-09T09:26:10.570Z",
                  },
                },
              },
            },
          },
        },
      },
      "403": {
        description: "User is not allowed to fetch this board",
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
