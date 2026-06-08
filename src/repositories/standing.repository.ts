import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { BaseRepository, RepositoryError } from "./base.repository";

interface StandingUpdate {
  teamId: string;
  position: number;
  playedGames: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form?: unknown;
}

type StandingCreate = Parameters<typeof prisma.standing.create>[0]["data"];
type StandingUpdateData = Parameters<typeof prisma.standing.update>[0]["data"];

export class StandingRepository extends BaseRepository<
  typeof prisma.standing,
  StandingCreate,
  StandingUpdateData
> {
  constructor() {
    super("Standing", prisma.standing as never);
  }

  async getCompetitionStandings(competitionId: string): Promise<unknown[]> {
    try {
      const standings = await prisma.standing.findMany({
        where: { competitionId },
        orderBy: [{ position: "asc" }, { points: "desc" }],
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              logo: true,
              venue: true,
              country: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
        },
      });

      return standings;
    } catch (error) {
      logger.error("StandingRepository.getCompetitionStandings failed", { competitionId, error });
      throw new RepositoryError("Failed to get competition standings", "GET_STANDINGS_FAILED", error);
    }
  }

  async updateStandings(
    competitionId: string,
    standings: StandingUpdate[],
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const s of standings) {
          const existing = await tx.standing.findFirst({
            where: { competitionId, teamId: s.teamId },
          });

          const data = {
            position: s.position,
            playedGames: s.playedGames,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            goalDifference: s.goalsFor - s.goalsAgainst,
            points: s.points,
            form: s.form ?? "",
          };

          if (existing) {
            await tx.standing.update({
              where: { id: existing.id },
              data,
            });
          } else {
            await tx.standing.create({
              data: {
                competitionId,
                teamId: s.teamId,
                ...data,
              },
            });
          }
        }
      });
    } catch (error) {
      logger.error("StandingRepository.updateStandings failed", { competitionId, error });
      throw new RepositoryError("Failed to update standings", "UPDATE_STANDINGS_FAILED", error);
    }
  }
}

export const standingRepository = new StandingRepository();
export default standingRepository;
