import { Role } from "@prisma/client";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { UserRepository } from "@/lib/repositories/user-repository";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const AuthService = {
  async register(input: RegisterInput) {
    const email = normalizeEmail(input.email);
    const existingUser = await UserRepository.findSafeByEmail(email);

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);

    return UserRepository.create({
      email,
      name: input.name.trim(),
      passwordHash,
      role: input.role ?? Role.REFERRER,
    });
  },

  async verifyCredentials(input: LoginInput) {
    const email = normalizeEmail(input.email);
    const user = await UserRepository.findWithPasswordByEmail(email);

    if (!user) {
      return null;
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
};
