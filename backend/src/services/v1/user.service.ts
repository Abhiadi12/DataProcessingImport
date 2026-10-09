import { Role } from "@prisma/client";
import { USER_MESSAGES } from "../../constants/index.js";
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
      throw new NotFoundError(USER_MESSAGES.NOT_FOUND);
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
      throw new NotFoundError(USER_MESSAGES.NOT_FOUND);
    }

    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new BadRequestError(USER_MESSAGES.CURRENT_PASSWORD_INCORRECT, {
        fieldErrors: { currentPassword: [USER_MESSAGES.CURRENT_PASSWORD_INCORRECT] },
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
      throw new NotFoundError(USER_MESSAGES.NOT_FOUND);
    }

    if (currentUserId === targetId) {
      throw new ForbiddenError(USER_MESSAGES.CANNOT_MODIFY_SELF);
    }
    if (target.role === Role.ADMIN && input.role && input.role !== Role.ADMIN) {
      throw new ForbiddenError(USER_MESSAGES.CANNOT_DEMOTE_ADMIN);
    }

    const user = await this.userRepository.updateAsAdmin(targetId, input);
    return toPublicUser(user);
  }
}
