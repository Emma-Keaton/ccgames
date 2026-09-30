import type { Metadata } from "next"
import Image from "next/image"
import Navigation from "@/components/Navigation"
import { NewsList } from "@/components/NewsList"
import { PinnedRegistrationCard } from "@/components/PinnedRegistrationCard"
import { cachedRestGet } from "@/lib/public-api"
import { cacheKey } from "@/lib/cache"
import type { NewsPost } from "@/components/NewsList"
import type { RegistrationAnnouncementData } from "@/components/PinnedRegistrationCard"

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
  const [posts, tournamentsData] = await Promise.all([
    cachedRestGet<NewsPost>(
      "tournament_posts?select=id,title,slug,excerpt,category,image_url,published_at,tournament_id,tournaments(name,slug)&published=is.true&order=published_at.desc&limit=60",
      {
        sharedKey: cacheKey("public", "news", "list"),
        sharedTtlSeconds: 300,
        revalidate: 60,
      }
    ),
    cachedRestGet<RegistrationAnnouncementData>(
      "tournaments?select=id,name,slug,edition,venue_city,start_date,end_date,settings,sports(id,code,name,scoring_type)&is_active=is.true&limit=5",
      {
        revalidate: 60,
      }
    ),
  ])

  const openRegistrationTournament = tournamentsData.find(
    (t) => Boolean(t.settings?.registration_open)
  )

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-32">
      <Navigation />

      <div data-tour="news-list" className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <Image src="/mascot/mascot-base.webp" alt="Odum Eze, Coal City Games mascot" width={100} height={134} className="h-24 w-auto object-contain" />
          <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Newsroom</h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Match reports, tournament registration announcements, and tactical breakdowns from Coal City Games.
          </p>
          </div>
        </header>

        {openRegistrationTournament && (
          <PinnedRegistrationCard tournament={openRegistrationTournament} />
        )}

        <NewsList posts={posts} />
      </div>
    </div>
  )
}
