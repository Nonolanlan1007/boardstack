import prisma from "~/lib/prisma";

export default defineTask({
  meta: {
    name: "delete_expired_invites",
    description: "Delete expired invites",
  },
  run: async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    await prisma.board_invitations.deleteMany({
      where: {
        created_at: {
          lt: oneWeekAgo,
        },
      },
    });

    return { result: "OK" };
  },
});
