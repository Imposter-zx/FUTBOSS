export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Footer } from "@/components/layout/footer"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "FUTBOSS - The Owner of Football",
    template: "%s | FUTBOSS",
  },
  description:
    "Your ultimate football companion. Live scores, stats, standings, and everything you need to follow the beautiful game.",
  keywords: ["football", "soccer", "live scores", "FUTBOSS", "matches", "standings"],
  authors: [{ name: "FUTBOSS Team" }],
  creator: "FUTBOSS",
  publisher: "FUTBOSS",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://futboss.com",
    siteName: "FUTBOSS",
    title: "FUTBOSS - The Owner of Football",
    description:
      "Your ultimate football companion. Live scores, stats, standings, and everything you need to follow the beautiful game.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "FUTBOSS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FUTBOSS - The Owner of Football",
    description:
      "Your ultimate football companion. Live scores, stats, standings, and everything you need to follow the beautiful game.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 overflow-x-hidden">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </div>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
