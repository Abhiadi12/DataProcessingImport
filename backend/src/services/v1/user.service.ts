import { BadRequestError } from "../../errors/bad-request.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import type { UpdateProfileData, UserRepository } from "../../repositories/v1/user.repository.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { toPublicUser, type PublicUser } from "./user.mapper.js";

export type UpdateProfileInput = UpdateProfileData;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.userRepository.updateProfile(userId, input);
    return toPublicUser(user);
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new BadRequestError("Current password is incorrect", {
        fieldErrors: { currentPassword: ["Current password is incorrect"] },
      });
    }

    const passwordHash = await hashPassword(input.newPassword);
    await this.userRepository.updatePasswordAndRevokeSessions(userId, passwordHash);
  }
}
