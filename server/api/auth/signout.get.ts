export default defineEventHandler(async (event) => {
  await clearUserSession(event);

  deleteCookie(event, "nuxt-session");

  await sendRedirect(event, "/", 302);
});
