import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { User, Mail, Calendar, Shield, Trophy, Star } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import Link from "next/link"
import type { User as UserType } from "@/types"

async function ProfileContent() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/login")

  const user = session.user

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-background to-surface p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Avatar className="h-24 w-24 shrink-0 ring-4 ring-border">
            {user.image && <AvatarImage src={user.image} />}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl font-bold text-foreground">
              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{user.name ?? "User"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="mr-1 h-3 w-3" /> {user.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" /> Member
              </Badge>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/settings">Edit Profile</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Favorite Teams</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No favorite teams yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Favorite Competitions</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No favorite competitions yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Free Plan</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-surface/50 px-4 py-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Name:</span>
            <span className="text-sm font-medium text-foreground">{user.name ?? "Not set"}</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface/50 px-4 py-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium text-foreground">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface/50 px-4 py-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Role:</span>
            <span className="text-sm font-medium text-foreground">{user.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const metadata = {
  title: "Profile",
  description: "Your FUTBOSS profile",
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}
