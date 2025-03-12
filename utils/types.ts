import type {
  board_members,
  boards,
  board_lists,
  board_labels,
  board_invitations,
  board_cards,
  users,
} from "@prisma/client";

export type DetailedBoard = boards & {
  lists: BoardList[];
  labels: board_labels[];
  invitations: board_invitations[] & { avatar: string }[];
  created_at: string;
  updated_at: string;
  members: BoardMember[];
  current_user_role: MemberRole;
  owner: Omit<BoardMember, "role">;
};
export type BoardCard = board_cards & { labels: { label_id: string }[] };
export type BoardList = board_lists & { cards: BoardCard[] };
export type BoardMember = board_members & {
  full_name: string;
  avatar: string;
  email: string;
};
export type MemberRole = "reader" | "member" | "admin" | "owner";
export type SummarizedBoard = boards & {
  members: { user_id: string; role: MemberRole }[];
};
export interface UserProfile extends Omit<users, "password"> {
  avatar: string;
}

export interface ActivityLog {
  id: string;
  parent_board_id: string | null;
  parent_card_id: string | null;
  action: string;
  created_by: string;
  old_value: string | null;
  new_value: string | null;
  linked_value: string | null;
  full_name: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}
