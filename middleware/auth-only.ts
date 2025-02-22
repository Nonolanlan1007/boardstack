export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  if (!loggedIn.value) return navigateTo(`/signin?redirectTo=${encodeURIComponent(to.fullPath)}`, { redirectCode: 302 });
});
