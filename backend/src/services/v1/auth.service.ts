import type { UserRepository } from "../../repositories/v1/user.repository.js";
import { hashPassword } from "../../utils/password.js";
import { toPublicUser, type PublicUser } from "./user.mapper.js";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });
    return toPublicUser(user);
  }
}
