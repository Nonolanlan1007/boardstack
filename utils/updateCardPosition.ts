import type { BoardCard } from "~/utils/types";

export default function updateCardPosition(
  updatedCard: BoardCard,
  currentBoard: DetailedBoard,
): BoardList[] {
  const oldCard = currentBoard.lists
    .flatMap((l) => l.cards)
    .find((c) => c.id === updatedCard.id)!;
  const newBoard = { ...currentBoard };

  if (
    oldCard.position !== updatedCard.position ||
    oldCard.parent_list !== updatedCard.parent_list
  ) {
    const updateCardPositions = (list: BoardList, card: BoardCard) => {
      const cardsToUpdate = list.cards
        .filter((c) => c.id !== card.id)
        .sort((a, b) => a.position - b.position);
      if (list.id === card.parent_list)
        cardsToUpdate.splice(card.position, 0, card);
      cardsToUpdate.forEach((c, i) => (c.position = i));
      list.cards = cardsToUpdate;
    };

    const list = newBoard.lists.find((l) =>
      l.cards.some((c) => c.id === updatedCard.id),
    )!;
    updateCardPositions(list, updatedCard);

    if (oldCard.parent_list !== updatedCard.parent_list) {
      const newList = newBoard.lists.find(
        (l) => l.id === updatedCard.parent_list,
      )!;
      updateCardPositions(newList, updatedCard);
    }
  }

  return newBoard.lists;
}
