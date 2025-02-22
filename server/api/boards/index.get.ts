import prisma from "~/lib/prisma";
import type { boards } from "@prisma/client";

export default defineEventHandler(async (event): Promise<boards[]> => {
  await requireUserSession(event, { statusCode: 401 });

  const user = await auth.user(event);

  if (!user)
    throw createError({
      statusCode: 401,
    });

  return await prisma.boards.findMany({
    where: {
      OR: [
        { owner_id: user.id },
        {
          members: {
            some: {
              user_id: user.id,
            },
          },
        },
      ],
    },
    include: {
      members: {
        select: {
          user_id: true,
          role: true,
        },
      },
    },
  });
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Get boards",
    description: "Get all boards for the current user",
    operationId: "getBoards",
    responses: {
      "200": {
        description: "Boards successfully fetched",
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
                    description: "The id of the board",
                    example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                  },
                  title: {
                    type: "string",
                    description: "The title of the board",
                    example: "My awesome board",
                  },
                  description: {
                    type: "string",
                    description: "The description of the board",
                    nullable: true,
                    example: "This board is made for...",
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
                  owner_id: {
                    type: "string",
                    description: "The owner of the board",
                    format: "uuid",
                    example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                  },
                  created_at: {
                    type: "string",
                    description: "The date the board was created",
                    example: "2025-02-09T09:26:10.570Z",
                  },
                  updated_at: {
                    type: "string",
                    description: "The date the board was updated",
                    example: "2025-02-09T09:26:10.570Z",
                  },
                  members: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        user_id: {
                          type: "string",
                          description: "The id of the member",
                          format: "uuid",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
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
            },
          },
        },
      },
    },
  },
});
