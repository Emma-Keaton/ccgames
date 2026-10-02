import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import { NewsList } from "@/components/NewsList"
import { cachedRestGet } from "@/lib/public-api"
import { cacheKey } from "@/lib/cache"
import type { NewsPost } from "@/components/NewsList"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Newsroom | Coal City Games",
  description: "Match reports, tournament registration announcements, and tactical breakdowns from Coal City Games.",
  openGraph: {
    title: "Newsroom | Coal City Games",
    description: "Match reports, tournament registration announcements, and tactical breakdowns from Coal City Games.",
    siteName: "Coal City Games",
    type: "website",
  },
}

export default async function NewsPage() {
  const [posts] = await Promise.all([
    cachedRestGet<NewsPost>(
      "tournament_posts?select=id,title,slug,excerpt,category,image_url,published_at,tournament_id,tournaments(name,slug)&published=is.true&order=published_at.desc&limit=60",
      {
        sharedKey: cacheKey("public", "news", "list"),
        sharedTtlSeconds: 300,
        revalidate: 60,
      }
    ),
  ])

  return (
    <div className="min-h-screen bg-surface text-text pb-32">
      <Navigation />

      <div data-tour="news-list" className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="cc-card mb-8 flex flex-col gap-2 p-6 text-center sm:p-8 md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Newsroom</h1>
          <p className="text-text-muted max-w-2xl text-lg">
            Match reports and tactical breakdowns from Coal City Games.
          </p>
        </header>

        <NewsList posts={posts} />
      </div>
    </div>
  )
}
