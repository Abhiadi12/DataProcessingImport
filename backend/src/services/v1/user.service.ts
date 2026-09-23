import { BadRequestError } from "../../errors/bad-request.error.js";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import type {
  UpdateProfileData,
  UpdateUserAdminData,
  UserRepository,
} from "../../repositories/v1/user.repository.js";
import type { Paginated } from "../../types/pagination.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { toPublicUser, type PublicUser } from "./user.mapper.js";

export type UpdateProfileInput = UpdateProfileData;
export type UpdateUserInput = UpdateUserAdminData;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ListUsersInput {
  page: number;
  limit: number;
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

  async listUsers({ page, limit }: ListUsersInput): Promise<Paginated<PublicUser>> {
    const { users, total } = await this.userRepository.list({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: users.map(toPublicUser),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(
    currentUserId: string,
    targetId: string,
    input: UpdateUserInput,
  ): Promise<PublicUser> {
    const target = await this.userRepository.findById(targetId);
    if (!target) {
      throw new NotFoundError("User not found");
    }

    if (currentUserId === targetId) {
      throw new ForbiddenError("You cannot change your own role or active status");
    }
    if (target.role === "ADMIN" && input.role && input.role !== "ADMIN") {
      throw new ForbiddenError("You cannot demote an admin to a lower role");
    }

    const user = await this.userRepository.updateAsAdmin(targetId, input);
    return toPublicUser(user);
  }
}
