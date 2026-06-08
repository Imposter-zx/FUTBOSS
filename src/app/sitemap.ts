import type { MetadataRoute } from "next"
import { competitionService } from "@/services/competition.service"
import type { Competition, Team, Player, Match } from "@/types"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://futboss.com"

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/competitions`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.3 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ]

  let competitionRoutes: MetadataRoute.Sitemap = []
  try {
    const result = await competitionService.findActive()
    if (result.success) {
      const competitions = result.data as Competition[]
      competitionRoutes = competitions.map((comp) => ({
        url: `${baseUrl}/competitions/${comp.id}`,
        lastModified: new Date(comp.updatedAt),
        changeFrequency: "hourly" as const,
        priority: 0.8,
      }))

      const nestedRoutes = competitions.flatMap((comp) => [
        { url: `${baseUrl}/competitions/${comp.id}/standings`, lastModified: new Date(comp.updatedAt), changeFrequency: "daily" as const, priority: 0.7 },
        { url: `${baseUrl}/competitions/${comp.id}/fixtures`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.7 },
        { url: `${baseUrl}/competitions/${comp.id}/results`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
        { url: `${baseUrl}/competitions/${comp.id}/stats`, lastModified: new Date(comp.updatedAt), changeFrequency: "weekly" as const, priority: 0.5 },
      ])
      competitionRoutes = [...competitionRoutes, ...nestedRoutes]
    }
  } catch {
    // continue without dynamic routes
  }

  return [...staticRoutes, ...competitionRoutes]
}
