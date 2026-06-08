/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://futboss.com",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: "/admin" },
      { userAgent: "*", disallow: "/api" },
      { userAgent: "*", disallow: "/_next" },
      { userAgent: "*", disallow: "/auth" },
      { userAgent: "*", disallow: "/settings" },
      { userAgent: "*", disallow: "/profile" },
    ],
    additionalSitemaps: [
      "https://futboss.com/sitemap-competitions.xml",
      "https://futboss.com/sitemap-teams.xml",
      "https://futboss.com/sitemap-players.xml",
      "https://futboss.com/sitemap-matches.xml",
    ],
  },
  exclude: [
    "/admin",
    "/admin/*",
    "/api/*",
    "/auth/*",
    "/settings/*",
    "/profile/*",
    "/_next/*",
    "/404",
    "/500",
    "/error",
  ],
  changefreq: "hourly",
  priority: 0.7,
  generateIndexSitemap: true,
  outDir: "./public",
  transform: async (config, path) => {
    if (path === "/") {
      return {
        loc: path,
        changefreq: "hourly",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      }
    }

    if (path.startsWith("/competitions") || path.startsWith("/teams")) {
      return {
        loc: path,
        changefreq: "daily",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      }
    }

    if (path.startsWith("/matches")) {
      return {
        loc: path,
        changefreq: "always",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      }
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    }
  },
  additionalPaths: async (config) => {
    const paths = []

    const competitions = [
      "uefa-champions-league",
      "premier-league",
      "la-liga",
      "serie-a",
      "bundesliga",
      "ligue-1",
    ]

    for (const slug of competitions) {
      paths.push({
        loc: `/competitions/${slug}`,
        changefreq: "daily",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      })
    }

    return paths
  },
}
