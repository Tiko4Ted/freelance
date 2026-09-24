import type { Role } from "@prisma/client";
import type { JWT } from "next-auth/jwt";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

type FindSessionUser = (userId: string) => Promise<SessionUser | null>;

export async function validatePersistedSessionToken(
  token: JWT,
  findSessionUser: FindSessionUser,
) {
  if (typeof token.id !== "string") {
    return token;
  }

  const user = await findSessionUser(token.id);

  if (!user) {
    return null;
  }

  return {
    ...token,
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role,
  };
}
