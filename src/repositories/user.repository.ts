import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BaseRepository, NotFoundError, DuplicateError, RepositoryError } from "./base.repository";

type UserCreate = Parameters<typeof prisma.user.create>[0]["data"];
type UserUpdate = Parameters<typeof prisma.user.update>[0]["data"];

export class UserRepository extends BaseRepository<
  typeof prisma.user,
  UserCreate,
  UserUpdate
> {
  constructor() {
    super("User", prisma.user as never);
  }

  async create(data: {
    email: string;
    name?: string;
    image?: string;
    passwordHash?: string;
  }): Promise<typeof prisma.user> {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (existing) {
        throw new DuplicateError("User", "email", data.email);
      }

      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          password: data.passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          preferences: true,
        },
      });

      return user as unknown as typeof prisma.user;
    } catch (error) {
      if (error instanceof DuplicateError) throw error;
      logger.error("UserRepository.create failed", { email: data.email, error });
      throw new RepositoryError("Failed to create user", "CREATE_FAILED", error);
    }
  }

  async findByEmail(email: string): Promise<typeof prisma.user | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      return user as unknown as typeof prisma.user ?? null;
    } catch (error) {
      logger.error("UserRepository.findByEmail failed", { email, error });
      throw new RepositoryError("Failed to find user by email", "FIND_BY_EMAIL_FAILED", error);
    }
  }

  async findById(id: string): Promise<typeof prisma.user> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError("User", id);
      }

      return user as unknown as typeof prisma.user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("UserRepository.findById failed", { id, error });
      throw new RepositoryError("Failed to find user by id", "FIND_BY_ID_FAILED", error);
    }
  }

  async updateProfile(
    id: string,
    data: { name?: string; image?: string; preferences?: Record<string, unknown> },
  ): Promise<typeof prisma.user> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.image !== undefined && { image: data.image }),
          ...(data.preferences !== undefined && { preferences: data.preferences }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user as unknown as typeof prisma.user;
    } catch (error) {
      if ((error as { code?: string })?.code === "P2025") {
        throw new NotFoundError("User", id);
      }
      logger.error("UserRepository.updateProfile failed", { id, error });
      throw new RepositoryError("Failed to update profile", "UPDATE_PROFILE_FAILED", error);
    }
  }

  async getFavorites(userId: string): Promise<{
    teams: unknown[];
    competitions: unknown[];
    players: unknown[];
  }> {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const teamIds = favorites.filter((f) => f.entityType === "team").map((f) => f.entityId);
      const competitionIds = favorites.filter((f) => f.entityType === "competition").map((f) => f.entityId);
      const playerIds = favorites.filter((f) => f.entityType === "player").map((f) => f.entityId);

      const [teams, competitions, players] = await Promise.all([
        prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: {
            id: true, name: true, slug: true, shortName: true, logo: true, venue: true,
          },
        }),
        prisma.competition.findMany({
          where: { id: { in: competitionIds } },
          select: { id: true, name: true, slug: true, logo: true, country: true },
        }),
        prisma.player.findMany({
          where: { id: { in: playerIds } },
          select: {
            id: true, name: true, slug: true, photo: true, position: true, nationality: true,
            team: { select: { id: true, name: true, slug: true, logo: true, shortName: true } },
          },
        }),
      ]);

      const teamMap = new Map(teams.map((t) => [t.id, t]));
      const compMap = new Map(competitions.map((c) => [c.id, c]));
      const playerMap = new Map(players.map((p) => [p.id, p]));

      return {
        teams: teamIds.map((id) => teamMap.get(id)).filter(Boolean),
        competitions: competitionIds.map((id) => compMap.get(id)).filter(Boolean),
        players: playerIds.map((id) => playerMap.get(id)).filter(Boolean),
      };
    } catch (error) {
      logger.error("UserRepository.getFavorites failed", { userId, error });
      throw new RepositoryError("Failed to get favorites", "GET_FAVORITES_FAILED", error);
    }
  }

  async addFavorite(
    userId: string,
    type: "team" | "competition" | "player",
    targetId: string,
  ): Promise<void> {
    try {
      await prisma.favorite.create({
        data: {
          userId,
          entityType: type,
          entityId: targetId,
        },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") {
        return;
      }
      logger.error("UserRepository.addFavorite failed", { userId, type, targetId, error });
      throw new RepositoryError("Failed to add favorite", "ADD_FAVORITE_FAILED", error);
    }
  }

  async removeFavorite(
    userId: string,
    type: "team" | "competition" | "player",
    targetId: string,
  ): Promise<void> {
    try {
      await prisma.favorite.delete({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType: type,
            entityId: targetId,
          },
        },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2025") {
        return;
      }
      logger.error("UserRepository.removeFavorite failed", { userId, type, targetId, error });
      throw new RepositoryError("Failed to remove favorite", "REMOVE_FAVORITE_FAILED", error);
    }
  }
}

export const userRepository = new UserRepository();
export default userRepository;
