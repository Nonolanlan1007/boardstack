import prisma from "~/lib/prisma";
import { z } from "zod";

const paramsSchema = z.object({
  invitationId: z.string(),
});

export default defineEventHandler(async (event) => {
  await requireUserSession(event, { statusCode: 401 });

  const { invitationId } = await getValidatedRouterParams(event, (params) =>
    paramsSchema.parse(params),
  );

  const user = await auth.user(event);

  if (!user)
    throw createError({
      statusCode: 401,
    });

  const invitation = await prisma.board_invitations.findFirst({
    where: { id: invitationId },
    include: {
      boards: true,
    },
  });

  if (!invitation)
    throw createError({
      statusCode: 404,
      message: "Invitation not found",
    });

  if (invitation.email !== user.email)
    throw createError({
      statusCode: 403,
    });

  return {
    ...invitation,
    created_by: undefined,
    email: undefined,
    board_title: invitation.boards!.title,
    board_background: invitation.boards!.background,
    board_background_type: invitation.boards!.background_type,
    board_background_credits: invitation.boards!.background_credits,
    boards: undefined,
  };
});

defineRouteMeta({
  openAPI: {
    tags: ["Boards"],
    summary: "Get invitation",
    description: "Get an invitation as the recipient of it",
    operationId: "getBoardInvitation",
    responses: {
      "200": {
        description: "Invitation successfully updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  description: "The id of the invitation",
                  example: "31f0676f-b0c4-4518-9efb-3b9986709aa1",
                },
                parent_board: {
                  type: "string",
                  format: "uuid",
                  description: "The id of the parent board",
                  example: "31f0676f-b0c4-4518-9efb-3b9986709aa1",
                },
                role: {
                  type: "string",
                  enum: ["reader", "member", "admin"],
                  description: "The future role of the invited user",
                  example: "member",
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
                board_title: {
                  type: "string",
                  description: "The title of the parent board",
                  example: "Awesome board!",
                },
                board_background: {
                  type: "string",
                  description: "The background of the parent board",
                  example: "black",
                },
                board_background_type: {
                  type: "string",
                  description: "The type of background",
                  enum: ["color", "image"],
                },
                board_background_credits: {
                  type: "string",
                  description:
                    "The background credits (if background is an Unsplash image)",
                  example:
                    "Lucas K,https://unsplash.com/photos/blue-and-orange-smoke-wQLAGv4_OYs",
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
  },
});
