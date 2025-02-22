import type { UserProfile } from "~/utils/types";

export default defineEventHandler(
  async (event): Promise<UserProfile | null> => {
    await requireUserSession(event);

    const user = await auth.user(event);

    if (!user) return null;

    return {
      ...user,
      avatar: getGravatar(user.email),
    };
  },
);

defineRouteMeta({
  openAPI: {
    tags: ["Accounts"],
    summary: "Get Current User Account",
    description: "Get account informations about the current user",
    operationId: "getUser",
    responses: {
      "200": {
        description: "Board successfully created",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  description: "The id of the user",
                  example: "65ac72b5-50b0-48cd-9652-2e88a23aaa98",
                },
                full_name: {
                  type: "string",
                  description: "The name of the user",
                  example: "John Doe",
                },
                avatar: {
                  type: "string",
                  description: "The avatar of the user",
                  example:
                    "https://www.gravatar.com/avatar/6b9d2...?size=256&d=identicon",
                },
                email: {
                  type: "string",
                  format: "email",
                  description: "The email address of the user",
                  example: "john.doe@boardstack.app",
                },
                created_at: {
                  type: "string",
                  description: "The date the account was created",
                  example: "2025-02-09T09:26:10.570Z",
                },
                updated_at: {
                  type: "string",
                  description: "The date the account was updated",
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
