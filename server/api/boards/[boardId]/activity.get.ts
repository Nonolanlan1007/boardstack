import z from "zod";
import prisma from "~/lib/prisma";

const paramsSchema = z.object({
  boardId: z.string(),
});

const queryValidator = z.object({
  start: z.number().optional(),
  count: z.number().optional(),
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
    skip: query.start ?? 0,
    take: query.count ?? 10,
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

  return logs.map((log) => ({
    ...log,
    user: undefined,
    full_name: log.user.full_name,
    avatar: getGravatar(log.user.email),
  }));
});
