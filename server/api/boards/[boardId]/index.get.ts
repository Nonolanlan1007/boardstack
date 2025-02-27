import prisma from "~/lib/prisma";
import { z } from "zod";

const paramsSchema = z.object({
  boardId: z.string(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { boardId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const user = await auth.user(event);

  if (!user)
    throw createError({
      statusCode: 401,
    });

  const board = await prisma.boards.findFirst({
    where: { id: boardId },
    include: {
      labels: {
        omit: {
          parent_board: true,
        },
      },
      lists: {
        include: {
          cards: {
            include: {
              labels: {
                select: {
                  label_id: true,
                },
              },
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        omit: {
          parent_board: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      invitations: {
        omit: {
          parent_board: true,
        },
      },
      members: {
        omit: {
          parent_board: true,
          id: true,
        },
        include: {
          users: {
            select: {
              full_name: true,
              email: true,
            },
          },
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

  return {
    ...board,
    invitations: board.invitations.map((invitation) => ({
      ...invitation,
      avatar: getGravatar(invitation.email),
    })),
    members: board.members.map((member) => ({
      ...member,
      users: undefined,
      full_name: member.users!.full_name,
      avatar: getGravatar(member.users!.email),
      email: member.users!.email,
    })),
  };
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Get board",
    description: "Get all data for a single board",
    operationId: "getBoard",
    responses: {
      "200": {
        description: "Board successfully fetched",
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
                  labels: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                          description: "The id of the label",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                        },
                        label: {
                          type: "string",
                          description: "The label",
                          example: "Bug",
                        },
                        color: {
                          type: "string",
                          format: "color",
                          description: "The color of the label",
                          example: "#FFFFFF",
                        },
                        created_by: {
                          type: "string",
                          format: "uuid",
                          description:
                            "The id of the user who created this label",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                        },
                        created_at: {
                          type: "string",
                          description: "The date the label was created",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                        updated_at: {
                          type: "string",
                          description: "The date the label was updated",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                      },
                    },
                  },
                  invitations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                          description: "The id of the invitation",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                        },
                        email: {
                          type: "string",
                          format: "email",
                          description: "The email address of the invited user",
                          example: "john.doe@boardstack.app",
                        },
                        avatar: {
                          type: "string",
                          description: "The gravatar of the invited user",
                          example:
                            "https://www.gravatar.com/avatar/d5e...d9a?size=256&d=identicon",
                        },
                        role: {
                          type: "string",
                          enum: ["reader", "member", "admin"],
                          description: "The future role of the invited user",
                          example: "member",
                        },
                        created_by: {
                          type: "string",
                          format: "uuid",
                          description: "The user who created this invitation",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                        },
                        created_at: {
                          type: "string",
                          description: "The date the invitation was created",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                        updated_at: {
                          type: "string",
                          description: "The date the invitation was updated",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                      },
                    },
                  },
                  members: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        user_id: {
                          type: "string",
                          format: "uuid",
                          description: "The id of the user",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                        },
                        email: {
                          type: "string",
                          format: "email",
                          description: "The email address of the member",
                          example: "john.doe@boardstack.app",
                        },
                        avatar: {
                          type: "string",
                          description: "The gravatar of the invited user",
                          example:
                            "https://www.gravatar.com/avatar/d5e...d9a?size=256&d=identicon",
                        },
                        role: {
                          type: "string",
                          enum: ["reader", "member", "admin"],
                          description: "The role of the member",
                          example: "member",
                        },
                        created_at: {
                          type: "string",
                          description: "The date the member joined the board",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                        updated_at: {
                          type: "string",
                          description: "The date the member was updated",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                      },
                    },
                  },
                  lists: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                          description: "The id of the list",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                        },
                        title: {
                          type: "string",
                          description: "The title of the list",
                          example: "My awesome list",
                        },
                        position: {
                          type: "number",
                          description: "The position of the list in the board",
                          example: 0,
                        },
                        created_by: {
                          type: "string",
                          format: "uuid",
                          description: "The user who created this list",
                          example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                        },
                        hide_when_blank: {
                          type: "boolean",
                          example: false,
                        },
                        created_at: {
                          type: "string",
                          description: "The date the list was created",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                        updated_at: {
                          type: "string",
                          description: "The date the list was updated",
                          example: "2025-02-09T09:26:10.570Z",
                        },
                        cards: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: {
                                type: "string",
                                format: "uuid",
                                description: "The id of the card",
                                example: "13jc72b5-856l-48cd-9652-2e88a23aoi98",
                              },
                              title: {
                                type: "string",
                                description: "The title of the card",
                                example: "My awesome card",
                              },
                              description: {
                                type: "string",
                                description: "The description of the card",
                                example: "This card will...",
                                nullable: true,
                              },
                              position: {
                                type: "number",
                                description:
                                  "The position of the card in the parent list",
                                example: 0,
                              },
                              created_at: {
                                type: "string",
                                description: "The date the card was created",
                                example: "2025-02-09T09:26:10.570Z",
                              },
                              updated_at: {
                                type: "string",
                                description: "The date the card was updated",
                                example: "2025-02-09T09:26:10.570Z",
                              },
                              labels: {
                                type: "array",
                                description: "The labels of the card",
                                items: {
                                  type: "object",
                                  properties: {
                                    labelId: {
                                      type: "string",
                                      format: "uuid",
                                      description: "The id of the label",
                                      example:
                                        "13jc72b5-856l-48cd-9652-2e88a23aoi98",
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
