import prisma from "~/lib/prisma";
import { z } from "zod";
import { broadcastSSE } from "~/server/api/events/index.get";
import type { activity_logsCreateManyInput } from "@prisma/client";
import { v4 as uuid } from "uuid";

const paramsSchema = z.object({
  boardId: z.string(),
  cardId: z.string(),
});

const bodySchema = z.object({
  parent_list: z.string().optional(),
  position: z.number().optional(),
  title: z.string().trim().max(50).optional(),
  description: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  assigned_to: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId, cardId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  if (
    !body.parent_list &&
    body.position === undefined &&
    !body.title &&
    body.description === undefined &&
    body.assigned_to === undefined &&
    !body.labels
  )
    return createError({
      statusCode: 400,
      message:
        "One of the following fields are required: `title`, `description`, `position`, `parent_list`, `assigned_to` or `labels`",
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

  const card = await prisma.board_cards.findFirst({
    where: { id: cardId },
    include: {
      labels: {
        select: {
          label_id: true,
        },
      },
    },
  });

  if (!card)
    throw createError({
      statusCode: 404,
      message: "Card not found",
    });

  if (body.labels) {
    const existingLabelIds = card.labels.map((label) => label.label_id);

    const labelsToRemove = existingLabelIds.filter(
      (id) => !body.labels!.includes(id),
    );

    const labelsToAdd = body.labels.filter(
      (id) => !existingLabelIds.includes(id),
    );

    if (labelsToRemove.length > 0)
      await prisma.card_labels.deleteMany({
        where: {
          card_id: cardId,
          label_id: {
            in: labelsToRemove,
          },
        },
      });

    if (labelsToAdd.length > 0)
      await prisma.card_labels.createMany({
        data: labelsToAdd.map((labelId) => ({
          card_id: cardId,
          label_id: labelId,
        })),
      });
  }

  if (body.assigned_to && body.assigned_to !== user.id) {
    const member = await prisma.board_members.findFirst({
      where: { user_id: body.assigned_to, parent_board: boardId },
    });

    if (!member)
      throw createError({
        statusCode: 404,
        message: "Member not found",
      });
  }

  const newCard = await prisma.board_cards.update({
    where: { id: cardId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.parent_list && { parent_list: body.parent_list }),
      ...(body.position !== undefined && { position: body.position }),
      ...(body.assigned_to !== undefined && { assigned_to: body.assigned_to }),
    },
    include: {
      labels: {
        select: {
          label_id: true,
        },
      },
    },
  });

  const actions: Omit<
    activity_logsCreateManyInput,
    "id" | "parent_board_id" | "created_by"
  >[] = [];

  if (card.title !== newCard.title)
    actions.push({
      action: "renamed_card",
      old_value: card.title,
      new_value: newCard.title,
    });

  if (card.description !== newCard.description)
    actions.push({
      action: "update_card_description",
    });

  if (card.parent_list !== newCard.parent_list)
    actions.push({
      action: "moved_card",
      old_value: card.parent_list,
      new_value: newCard.parent_list,
    });

  if (card.assigned_to !== newCard.assigned_to)
    actions.push({
      action: "update_assigned_to_card",
      old_value: card.assigned_to,
      new_value: newCard.assigned_to,
    });

  await prisma.activity_logs.createMany({
    data: actions.map((action) => ({
      ...action,
      id: uuid(),
      parent_board_id: boardId,
      parent_card_id: cardId,
      created_by: user.id,
    })) as activity_logsCreateManyInput[],
  });

  broadcastSSE(
    `boards/${boardId}`,
    JSON.stringify({
      type: "card_updated",
      data: { ...newCard },
    }),
  );

  if (body.position !== undefined || body.parent_list !== card.parent_list) {
    let cardsToUpdate = await prisma.board_cards.findMany({
      where: {
        id: { not: card.id },
        parent_list: card.parent_list,
      },
      orderBy: {
        position: "asc",
      },
    });

    if (!body.parent_list)
      cardsToUpdate.splice(
        body.position !== undefined ? body.position : card.position,
        0,
        newCard,
      );

    for (let i = 0; i < cardsToUpdate.length; i++) {
      await prisma.board_cards.update({
        where: { id: cardsToUpdate[i].id },
        data: { position: i },
        include: {
          labels: {
            select: {
              label_id: true,
            },
          },
        },
      });
    }

    if (body.parent_list && body.parent_list !== card.parent_list) {
      cardsToUpdate = await prisma.board_cards.findMany({
        where: {
          id: { not: card.id },
          parent_list: body.parent_list,
        },
        orderBy: {
          position: "asc",
        },
      });

      cardsToUpdate.splice(
        body.position !== undefined ? body.position : card.position,
        0,
        newCard,
      );

      for (let i = 0; i < cardsToUpdate.length; i++) {
        await prisma.board_cards.update({
          where: { id: cardsToUpdate[i].id },
          data: { position: i },
          include: {
            labels: {
              select: {
                label_id: true,
              },
            },
          },
        });
      }
    }
  }

  return "Card updated";
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Update card",
    description: "Update a card",
    operationId: "updateBoardCard",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              parent_list: {
                type: "string",
                format: "uuid",
                description: "The id of the parent list of the card",
                example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
              },
              position: {
                type: "number",
                description: "The position of the card in the parent list",
                example: 2,
              },
              title: {
                type: "string",
                description: "The title of the card",
                example: "Awesome card",
              },
              description: {
                type: "string",
                nullable: true,
                description: "The description of the card",
                example: null,
              },
              labels: {
                type: "array",
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
      "200": {
        description: "Card successfully updated",
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
                "One of the following fields are required: `title`, `background`, `description`, `position`, `parent_list` or `labels`",
            },
          },
        },
      },
    },
  },
});
