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
    case "invitation_created":
      return "pi-user-plus";
    case "invitation_accepted":
      return "pi-user-plus";
    case "invitation_role_updated":
      return "pi-user-edit";
    case "invitation_deleted":
      return "pi-user-minus";
    case "invitation_rejected":
      return "pi-user-minus";
    case "label_created":
      return "pi-tag";
    case "label_label_updated":
      return "pi-tag";
    case "label_color_updated":
      return "pi-tag";
    case "label_deleted":
      return "pi-tag";
    case "list_created":
      return "pi-list";
    default:
      return "pi-wrench";
  }
}

export function selectAction(log: ActivityLog, board: DetailedBoard) {
  const parent_card = board.lists
    .flatMap((l) => l.cards)
    .find((c) => c.id === log.parent_card_id);

  const allMembers = [
    {
      user_id: board.owner.id,
      full_name: board.owner.full_name,
      avatar: board.owner.avatar,
    },
    ...board.members,
  ];

  switch (log.action) {
    case "rename_board":
      return "renamed the board";
    case "update_board_background":
      return "updated the background";
    case "card_created":
      return `created a card in list '${board.lists.find((l) => l.id === log.linked_value)!.title}'`;
    case "card_deleted":
      return `deleted a card from list '${board.lists.find((l) => l.id === log.linked_value)!.title}'`;
    case "renamed_card":
      return `renamed a card`;
    case "update_card_description":
      return `updated the description of card '${board.lists.flatMap((l) => l.cards).find((c) => c.id === log.parent_card_id)!.title}'`;
    case "moved_card":
      return parent_card ? `moved card '${parent_card.title}'` : "moved a card";
    case "update_assigned_to_card": {
      const member = allMembers.find((l) => l.user_id === log.new_value);
      return parent_card
        ? `assigned ${member ? member.full_name : "nobody"} to card '${parent_card!.title}'`
        : `assigned ${member ? member.full_name : "nobody"} to a card`;
    }
    case "invitation_created":
      return `invited ${log.new_value} to join the board`;
    case "invitation_accepted":
      return "accepted his invitation";
    case "invitation_role_updated":
      return `updated the role of ${log.linked_value}`;
    case "invitation_deleted":
      return `deleted the invitation of ${log.linked_value}`;
    case "invitation_rejected":
      return "rejected his invitation";
    case "label_created":
      return `created a label named '${log.new_value}'`;
    case "label_label_updated":
      return "updated a label";
    case "label_color_updated": {
      const label = board.labels.find((l) => l.id === log.linked_value);
      return `updated the color of the label '${label ? label.label : "unknown"}'`;
    }
    case "label_deleted":
      return `deleted label '${log.linked_value}'`;
    case "list_created":
      return `created a list named '${log.new_value}'`;
    default:
      return "did an unknown action";
  }
}
