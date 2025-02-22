import type { ToastServiceMethods } from "primevue";
import getUserRole from "~/utils/getUserRole";

export const useBoardsStore = defineStore("boards", {
  state: () => ({
    boards: [] as (DetailedBoard | SummarizedBoard)[],
  }),
  actions: {
    async fetchBoards(currentUser: UserProfile) {
      const { data } = await useFetch<SummarizedBoard[]>(`/api/boards`, {
        watch: false,
        immediate: true,
      });

      if (!data.value) return;

      data.value.forEach((board) => {
        const currentBoardData = this.boards.find((b) => b.id === board.id);

        if (!currentBoardData)
          return this.boards.push({
            ...board,
            current_user_role: getUserRole(currentUser, board),
          });

        this.boards = this.boards.filter((b) => b.id !== currentBoardData.id);

        this.boards.push({
          ...board,
          description: currentBoardData.description,
          lists: "lists" in currentBoardData ? currentBoardData.lists : [],
          labels: "labels" in currentBoardData ? currentBoardData.labels : [],
          current_user_role: getUserRole(currentUser, board),
        });
      });
    },
    async renameBoard(
      boardId: string,
      value: string,
      toast: ToastServiceMethods,
    ) {
      toast.add({
        severity: "info",
        summary: "Loading",
        detail: "Updating title...",
        closable: false,
      });

      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: value,
        }),
      }).catch((res) => res);
      toast.removeAllGroups();

      if (!res.ok) {
        const data = await res.json();

        return toast.add({
          severity: "error",
          summary: "Error",
          detail: `${res.status} - ${data.message}`,
          life: 5000,
        });
      }

      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Board title updated",
        life: 3000,
      });
    },
    async fetchBoard(boardId: string) {
      const { data, error } = await useFetch<DetailedBoard>(
        `/api/boards/${boardId}`,
        {
          watch: false,
          immediate: true,
        },
      );

      if (!data.value) throw createError(error.value || "Unknown error");

      this.mergeBoards(boardId, data.value);

      if (!this.boards.some((b) => b.id === boardId)) {
        this.boards.push(data.value);
      }
    },
    mergeBoards(boardId: string, data: DetailedBoard) {
      this.boards = this.boards.map((b) =>
        b.id === boardId ? { ...b, ...data } : b,
      );
    },
  },
});
