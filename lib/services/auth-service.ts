import { Role } from "@prisma/client";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  UserRepository,
  type UserWithPassword,
} from "@/lib/repositories/user-repository";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type CredentialVerifierDependencies = {
  findUserByEmail: (email: string) => Promise<UserWithPassword | null>;
  comparePassword: (password: string, passwordHash: string) => Promise<boolean>;
};

export function createCredentialVerifier(
  dependencies: CredentialVerifierDependencies,
) {
  return async function verifyCredentials(input: LoginInput) {
    const email = normalizeEmail(input.email);
    const user = await dependencies.findUserByEmail(email);

    if (!user) {
      return null;
    }

    const passwordMatches = await dependencies.comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches || !user.emailVerifiedAt) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  };
}

const verifyVerifiedCredentials = createCredentialVerifier({
  findUserByEmail: (email) => UserRepository.findWithPasswordByEmail(email),
  comparePassword: verifyPassword,
});

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
    return verifyVerifiedCredentials(input);
  },
};
