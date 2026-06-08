import type { Metadata } from "next";

const siteName = "FUTBOSS";
const siteDescription = "Ultimate football platform - live scores, stats, and community";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://futboss.com";
const siteImage = `${siteUrl}/images/og-image.png`;

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
  noIndex?: boolean;
}

export function generateMetadata({
  title,
  description = siteDescription,
  path = "",
  image = siteImage,
  type = "website",
  publishedAt,
  updatedAt,
  tags = [],
  noIndex = false,
}: SEOProps): Metadata {
  const url = `${siteUrl}${path}`;
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(updatedAt && { modifiedTime: updatedAt }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}

export function generateMatchMetadata(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  date: string,
  status: string,
): Metadata {
  const title = `${homeTeam} vs ${awayTeam} - ${competition}`;
  const isLive = ["LIVE", "HALF_TIME", "EXTRA_TIME", "PENALTIES"].includes(status);
  const isFinished = status === "FINISHED";
  const description = isLive
    ? `Live: ${homeTeam} vs ${awayTeam} - ${competition}. Follow the action live on FUTBOSS.`
    : isFinished
      ? `${homeTeam} vs ${awayTeam} - ${competition} match result and highlights.`
      : `${homeTeam} vs ${awayTeam} - ${competition} match preview, lineups, and stats.`;

  return generateMetadata({
    title,
    description,
    path: `/matches/${homeTeam.toLowerCase().replace(/\s+/g, "-")}-vs-${awayTeam.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

export function generateTeamMetadata(
  teamName: string,
  competition: string,
): Metadata {
  return generateMetadata({
    title: `${teamName} - Squad, Stats, Fixtures & Results`,
    description: `${teamName} | ${competition} - View squad, stats, fixtures, results, and top scorers for ${teamName}.`,
    path: `/teams/${teamName.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

export function generatePlayerMetadata(
  playerName: string,
  teamName: string,
): Metadata {
  return generateMetadata({
    title: `${playerName} - Stats, Matches & Profile`,
    description: `${playerName} | ${teamName} - View player stats, match history, and performance metrics.`,
    path: `/players/${playerName.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

export function generateCompetitionMetadata(
  competitionName: string,
  season: string,
): Metadata {
  return generateMetadata({
    title: `${competitionName} ${season} - Standings, Fixtures, Stats`,
    description: `${competitionName} ${season} - Follow the latest standings, fixtures, results, and top scorers.`,
    path: `/competitions/${competitionName.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

export function generateStructuredData(type: string, data: Record<string, unknown>) {
  const base = {
    "@context": "https://schema.org",
  };

  switch (type) {
    case "SportsEvent": {
      const match = data as {
        name: string;
        date: string;
        location?: string;
        homeTeam: string;
        awayTeam: string;
        homeScore?: number;
        awayScore?: number;
        status: string;
      };
      return {
        ...base,
        "@type": "SportsEvent",
        name: match.name,
        startDate: match.date,
        location: match.location ? { "@type": "Place", name: match.location } : undefined,
        homeTeam: { "@type": "SportsTeam", name: match.homeTeam },
        awayTeam: { "@type": "SportsTeam", name: match.awayTeam },
        ...(match.homeScore !== undefined && {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        }),
        eventStatus: match.status === "FINISHED"
          ? "https://schema.org/EventStatus/Completed"
          : match.status === "LIVE"
            ? "https://schema.org/EventStatus/Active"
            : "https://schema.org/EventStatus/Scheduled",
      };
    }

    case "SportsTeam": {
      const team = data as { name: string; logo?: string };
      return {
        ...base,
        "@type": "SportsTeam",
        name: team.name,
        logo: team.logo,
      };
    }

    case "Person": {
      const person = data as { name: string; image?: string; nationality?: string; position?: string };
      return {
        ...base,
        "@type": "Person",
        name: person.name,
        image: person.image,
        nationality: person.nationality,
        knowsAbout: person.position,
      };
    }

    case "WebSite":
      return {
        ...base,
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
      };

    default:
      return null;
  }
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

export { siteName, siteDescription, siteUrl, siteImage };
