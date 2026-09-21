import { NotFoundError } from "../../errors/not-found.error.js";
import type { UserRepository } from "../../repositories/v1/user.repository.js";
import { toPublicUser, type PublicUser } from "./user.mapper.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return toPublicUser(user);
  }
}
