export default function getUserRole(
  user: UserProfile,
  board: SummarizedBoard | DetailedBoard,
): MemberRole {
  return user.id === board.owner_id
    ? "owner"
    : (board.members.find((member) => member.user_id === user.id)!
        .role as MemberRole);
}
