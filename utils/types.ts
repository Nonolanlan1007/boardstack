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
