import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  Leagues: [
    { label: "Premier League", href: "/competitions/1" },
    { label: "La Liga", href: "/competitions/2" },
    { label: "Serie A", href: "/competitions/3" },
    { label: "Bundesliga", href: "/competitions/4" },
    { label: "Ligue 1", href: "/competitions/5" },
    { label: "Champions League", href: "/competitions/6" },
  ],
  Resources: [
    { label: "Live Scores", href: "/matches/live" },
    { label: "Fixtures", href: "/matches/fixtures" },
    { label: "Results", href: "/matches/results" },
    { label: "Standings", href: "/standings" },
    { label: "Transfers", href: "/transfers" },
    { label: "Stats", href: "/stats" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" showTagline />
            <p className="mt-4 text-sm text-muted-foreground">
              Your ultimate football companion. Live scores, stats, and everything you need to
              follow the beautiful game.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} FUTBOSS. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
