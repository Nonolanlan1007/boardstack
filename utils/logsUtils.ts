export function selectIcon(action: string) {
  switch (action) {
    case "rename_board":
      return "pi-pen-to-square";
    case "update_board_background":
      return "pi-image";
    case "card_created":
      return "pi-file-plus";
    case "card_deleted":
      return "pi-trash";
    case "renamed_card":
      return "pi-pen-to-square";
    case "update_card_description":
      return "pi-align-left";
    case "moved_card":
      return "pi-arrows-alt";
    case "update_assigned_to_card":
      return "pi-user-edit";
    default:
      return "pi-wrench";
  }
}
