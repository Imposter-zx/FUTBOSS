import { BaseService } from "./base.service";
import notificationRepository from "@/repositories/notification.repository";
import webSocketService from "./websocket.service";
import cacheService from "./cache.service";
import type { PaginationParams, PaginatedResult, ServiceResult } from "@/types";
import { NotificationType } from "@prisma/client";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export class NotificationService extends BaseService {
  constructor() {
    super("NotificationService");
  }

  async create(input: CreateNotificationInput): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const notification = await notificationRepository.create(input as Parameters<typeof notificationRepository.create>[0]);

      webSocketService.broadcastToUser(input.userId, "notification", {
        id: (notification as unknown as { id: string }).id,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
        createdAt: new Date().toISOString(),
      });

      this.logInfo("Notification created", {
        userId: input.userId,
        type: input.type,
        title: input.title,
      });

      return notification;
    });
  }

  async broadcastToAll(input: Omit<CreateNotificationInput, "userId">): Promise<ServiceResult<void>> {
    return this.wrapResult(async () => {
      webSocketService.broadcast("broadcast", "notification", {
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
      });

      this.logInfo("Broadcast notification sent", {
        type: input.type,
        title: input.title,
      });
    });
  }

  async getUserNotifications(
    userId: string,
    params?: PaginationParams,
    unreadOnly?: boolean,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    return this.wrapResult(async () => {
      return notificationRepository.getUserNotifications(userId, params, unreadOnly);
    });
  }

  async markAsRead(notificationId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      return notificationRepository.markAsRead(notificationId);
    });
  }

  async markAllAsRead(userId: string): Promise<ServiceResult<unknown>> {
    return this.wrapResult(async () => {
      const result = await notificationRepository.markAllAsRead(userId);
      return { markedRead: result.count };
    });
  }

  async getUnreadCount(userId: string): Promise<ServiceResult<number>> {
    return this.wrapResult(async () => {
      const cacheKey = cacheService.buildKey("user", userId, "unread");

      return cacheService.getOrSet(
        cacheKey,
        () => notificationRepository.getUnreadCount(userId),
        30,
      );
    });
  }

  async deleteNotification(notificationId: string): Promise<ServiceResult<void>> {
    return this.wrapResult(async () => {
      await notificationRepository.deleteNotification(notificationId);
    });
  }

  async createMatchNotification(
    userId: string,
    matchData: {
      homeTeam: string;
      awayTeam: string;
      type: "MATCH_START" | "GOAL" | "RED_CARD" | "MATCH_END";
      score?: string;
      matchId: string;
    },
  ): Promise<ServiceResult<unknown>> {
    const titles: Record<string, string> = {
      MATCH_START: `${matchData.homeTeam} vs ${matchData.awayTeam} has started!`,
      GOAL: `Goal! ${matchData.homeTeam} ${matchData.score} ${matchData.awayTeam}`,
      RED_CARD: `Red card in ${matchData.homeTeam} vs ${matchData.awayTeam}`,
      MATCH_END: `Full time: ${matchData.homeTeam} ${matchData.score} ${matchData.awayTeam}`,
    };

    const typeMap: Record<string, NotificationType> = {
      MATCH_START: NotificationType.MATCH_STARTED,
      GOAL: NotificationType.GOAL_SCORED,
      RED_CARD: NotificationType.RED_CARD,
      MATCH_END: NotificationType.FULL_TIME,
    };
    return this.create({
      userId,
      type: typeMap[matchData.type] ?? NotificationType.MATCH_STARTED,
      title: titles[matchData.type] ?? "Match update",
      message: `${matchData.homeTeam} vs ${matchData.awayTeam}`,
      data: { matchId: matchData.matchId, score: matchData.score },
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
