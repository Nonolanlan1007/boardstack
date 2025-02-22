import { v4 as uuid } from "uuid";
import prisma from "~/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().max(50),
  description: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

  const user = (await auth.user(event))!;

  const board = await prisma.boards.create({
    data: {
      id: uuid(),
      title: body.title,
      description: body.description,
      background: "black",
      background_type: "color",
      owner_id: user.id,
    },
  });

  setResponseStatus(event, 201);

  return board;
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Create a board",
    description: "Create a board for the current user",
    operationId: "createBoard",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["title", "description"],
            properties: {
              title: {
                type: "string",
                description: "The title of the board",
                example: "My awesome board",
              },
              description: {
                type: "string",
                description: "The description of the board",
                example: "This board is made for...",
                nullable: true,
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Board successfully created",
        content: {
          "application/json": {
            schema: {
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
              },
            },
          },
        },
      },
    },
  },
});
