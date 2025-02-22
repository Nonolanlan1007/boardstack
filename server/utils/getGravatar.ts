import { createHash } from "node:crypto";

export default function getGravatar(email: string): string {
  return `https://www.gravatar.com/avatar/${createHash("sha256").update(email).digest("hex")}?size=256&d=identicon`;
}
