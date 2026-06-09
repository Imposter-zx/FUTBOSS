import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { NotFoundError, RepositoryError } from "./base.repository";
import { buildPaginationQuery, buildPaginatedResult, type PaginationParams, type PaginatedResult } from "@/types";
import type { NotificationType } from "@prisma/client";

type NotificationEntity = Awaited<ReturnType<typeof prisma.notification.findUnique<{ where: { id: string } }>>>;

export class NotificationRepository {

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationEntity> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: (data.data ?? {}) as any,
          read: false,
        },
      });

      return notification as unknown as NotificationEntity;
    } catch (error) {
      logger.error("NotificationRepository.create failed", { userId: data.userId, error });
      throw new RepositoryError("Failed to create notification", "CREATE_FAILED", error);
    }
  }

  async getUserNotifications(
    userId: string,
    params?: PaginationParams,
    unreadOnly?: boolean,
  ): Promise<PaginatedResult<NotificationEntity>> {
    try {
      const query = buildPaginationQuery(params ?? {});
      const where: Record<string, unknown> = { userId };

      if (unreadOnly) {
        where.read = false;
      }

      const [data, total] = await Promise.all([
        prisma.notification.findMany({
          skip: query.skip,
          take: query.take,
          where,
          orderBy: { createdAt: "desc" },
        }),
        prisma.notification.count({ where }),
      ]);

      return buildPaginatedResult(data, total, params ?? {}) as PaginatedResult<NotificationEntity>;
    } catch (error) {
      logger.error("NotificationRepository.getUserNotifications failed", { userId, error });
      throw new RepositoryError("Failed to get notifications", "GET_USER_NOTIFICATIONS_FAILED", error);
    }
  }

  async markAsRead(notificationId: string): Promise<NotificationEntity> {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return notification as unknown as NotificationEntity;
    } catch (error) {
      if ((error as { code?: string })?.code === "P2025") {
        throw new NotFoundError("Notification", notificationId);
      }
      logger.error("NotificationRepository.markAsRead failed", { notificationId, error });
      throw new RepositoryError("Failed to mark notification as read", "MARK_AS_READ_FAILED", error);
    }
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return result;
    } catch (error) {
      logger.error("NotificationRepository.markAllAsRead failed", { userId, error });
      throw new RepositoryError("Failed to mark all as read", "MARK_ALL_READ_FAILED", error);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: { userId, read: false },
      });

      return count;
    } catch (error) {
      logger.error("NotificationRepository.getUnreadCount failed", { userId, error });
      throw new RepositoryError("Failed to get unread count", "GET_UNREAD_COUNT_FAILED", error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await prisma.notification.delete({
        where: { id: notificationId },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2025") {
        throw new NotFoundError("Notification", notificationId);
      }
      logger.error("NotificationRepository.deleteNotification failed", { notificationId, error });
      throw new RepositoryError("Failed to delete notification", "DELETE_FAILED", error);
    }
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
