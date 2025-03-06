export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as UserProfile | null,
  }),
  actions: {
    async fetchUser() {
      const cookies = useCookie("nuxt-session");

      const { data: user, error: userError } = await useFetch<UserProfile>(
        `/api/users/@me`,
        {
          watch: false,
          immediate: true,
        },
      );

      if (userError.value || !user.value) {
        cookies.value = null;
        setTimeout(() => navigateTo("/signin"), 100);
      }

      this.user = user.value;
    },
  },
});
