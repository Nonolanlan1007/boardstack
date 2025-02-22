import { z } from "zod";
import prisma from "~/lib/prisma";
import type { EventStream } from "h3";

const channels = new Map();

function createChannelIfNotExists(channel: string) {
  if (!channels.has(channel)) {
    channels.set(channel, new Set<EventStream>());
  }
}

export function broadcastSSE(channel: string, message: string) {
  if (channels.has(channel)) {
    channels
      .get(channel)
      .forEach((client: EventStream) => client.push(message));
  }
}

const querySchema = z.object({
  boardId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { boardId } = await getValidatedQuery(event, (query) =>
    querySchema.parse(query),
  );

  await requireUserSession(event);

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

  createChannelIfNotExists(`boards/${boardId}`);

  const eventStream = createEventStream(event);
  channels.get(`boards/${boardId}`).add(eventStream);

  eventStream.onClosed(() => {
    channels.get(`boards/${boardId}`).delete(eventStream);
    if (channels.get(`boards/${boardId}`).size === 0) {
      channels.delete(`boards/${boardId}`);
    }
  });

  return eventStream.send();
});
