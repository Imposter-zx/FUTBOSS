import bcrypt from "bcryptjs";
import { BaseService, NotFoundServiceError, ValidationServiceError, ConflictServiceError } from "./base.service";
import userRepository from "@/repositories/user.repository";
import cacheService from "./cache.service";
import type { ServiceResult } from "@/types";

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type UpdateProfileInput = {
  name?: string;
  image?: string;
  preferences?: Record<string, unknown>;
};

export class UserService extends BaseService {
  constructor() {
    super("UserService");
  }

  async register(input: RegisterInput): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const { email, password, name } = input;

      if (!email || !password) {
        throw new ValidationServiceError("Email and password are required");
      }

      if (password.length < 8) {
        throw new ValidationServiceError("Password must be at least 8 characters");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationServiceError("Invalid email format");
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await userRepository.create({
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
      });

      this.logInfo("User registered", { userId: (user as unknown as { id: string }).id });

      return user;
    });
  }

  async findByEmail(email: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const user = await userRepository.findByEmail(email.toLowerCase().trim());
      return user;
    });
  }

  async findById(id: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("user", id, "profile");

      return cacheService.getOrSet(
        cacheKey,
        () => userRepository.findById(id),
        300,
      );
    });
  }

  async updateProfile(
    id: string,
    input: UpdateProfileInput,
  ): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const user = await userRepository.updateProfile(id, input);
      await cacheService.invalidateUser(id);

      this.logInfo("User profile updated", { userId: id });

      return user;
    });
  }

  async getFavorites(userId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("user", userId, "favorites");

      return cacheService.getOrSet(
        cacheKey,
        () => userRepository.getFavorites(userId),
        60,
      );
    });
  }

  async addFavorite(
    userId: string,
    type: "team" | "competition" | "player",
    targetId: string,
  ): Promise<ServiceResult<void>> {
    return this.wrapResult(async () => {
      await userRepository.addFavorite(userId, type, targetId);
      await cacheService.invalidateUser(userId);

      this.logInfo("Favorite added", { userId, type, targetId });
    });
  }

  async removeFavorite(
    userId: string,
    type: "team" | "competition" | "player",
    targetId: string,
  ): Promise<ServiceResult<void>> {
    return this.wrapResult(async () => {
      await userRepository.removeFavorite(userId, type, targetId);
      await cacheService.invalidateUser(userId);

      this.logInfo("Favorite removed", { userId, type, targetId });
    });
  }

  async verifyPassword(
    email: string,
    password: string,
  ): Promise<ServiceResult<{ id: string; email: string; name: string | null }>> {
    return this.wrapResult(async () => {
      const user = await userRepository.findByEmail(email.toLowerCase().trim());

      if (!user) {
        throw new NotFoundServiceError("User", email);
      }

      const userData = user as unknown as {
        id: string;
        email: string;
        name: string | null;
        password: string | null;
      };

      if (!userData.password) {
        throw new ValidationServiceError("Account has no password set");
      }

      const isValid = await bcrypt.compare(password, userData.password);
      if (!isValid) {
        throw new ValidationServiceError("Invalid password");
      }

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      };
    });
  }
}

export const userService = new UserService();
export default userService;
