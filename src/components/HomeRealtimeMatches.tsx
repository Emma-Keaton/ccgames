"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { formatMatchTimeLabel, type MatchClockStats } from "@/lib/match-clock"
import { EmptyState } from "@/components/ui/feedback"

export interface TeamCardInfo {
  name: string
  abbr: string
  score?: number
}

export interface MatchCardRow {
  id: string
  home: TeamCardInfo
  away: TeamCardInfo
  status: string
  time?: string
  date?: string
  current_minute?: number | null
  stats?: MatchClockStats | null
}

interface HomeRealtimeMatchesProps {
  initialMatches: MatchCardRow[]
}

export function HomeRealtimeMatches({ initialMatches }: HomeRealtimeMatchesProps) {
  const supabase = createClient()
  const [matches, setMatches] = useState<MatchCardRow[]>(initialMatches)

  useEffect(() => {
    const channel = supabase
      .channel("home_matches_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fixtures",
        },
        (payload) => {
          const changed = payload.new as {
            id?: string
            home_score?: number | null
            away_score?: number | null
            status?: string | null
            current_minute?: number | null
            stats?: MatchClockStats | null
          }
          if (!changed || !changed.id) return

          setMatches((prev) =>
            prev.map((match) => {
              if (match.id !== changed.id) return match

              const isLive = changed.status === "in_progress" || changed.status === "extra_time"
              const updatedStats = changed.stats ?? match.stats
              const timeLabel = formatMatchTimeLabel({
                id: match.id,
                status: changed.status ?? match.status,
                current_minute: changed.current_minute ?? match.current_minute ?? null,
                stats: updatedStats,
              })

              return {
                ...match,
                home: {
                  ...match.home,
                  score: changed.home_score ?? match.home.score,
                },
                away: {
                  ...match.away,
                  score: changed.away_score ?? match.away.score,
                },
                status: isLive ? "LIVE" : changed.status ?? match.status,
                time: timeLabel,
                stats: updatedStats,
                current_minute: changed.current_minute ?? match.current_minute,
              }
            })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (matches.length === 0) {
    return (
      <EmptyState title="No matches scheduled for today." hint="Check upcoming fixtures below for the next games." />
    )
  }

  return (
    <section>
      <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 text-ink">
        <span className="w-2.5 h-2.5 rounded-full bg-live animate-pulse" />
        Matches of the Day
      </h2>
      <div className="space-y-4">
        {matches.map((match) => {
          const timeDisplay = formatMatchTimeLabel({
            id: match.id,
            status: match.status === "LIVE" ? "in_progress" : match.status,
            current_minute: match.current_minute ?? null,
            stats: match.stats,
          })

          return (
            <Link href={`/match/${match.id}`} key={match.id} className="block">
            <div className="cc-card cc-card--interactive group flex cursor-pointer flex-col items-center justify-between p-4 sm:flex-row sm:p-6">
              <div className="flex w-full flex-1 items-center justify-between gap-4 sm:w-auto">
                <div className="flex flex-1 items-center gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-bold text-text sm:h-10 sm:w-10 sm:text-sm">
                    {match.home.abbr}
                  </div>
                  <span className="text-sm font-semibold text-text sm:text-lg">{match.home.name}</span>
                </div>

                <div className="flex shrink-0 flex-col items-center px-4 sm:px-8">
                  {match.home.score !== undefined && match.away.score !== undefined ? (
                    <>
                      <div className="cc-score text-xl group-hover:text-primary sm:text-2xl">
                        {match.home.score} - {match.away.score}
                      </div>
                      <div
                        className={`cc-num mt-1 flex items-center gap-1.5 text-xs font-medium ${
                          match.status === "LIVE" ? "font-bold text-live" : "text-text-muted"
                        }`}
                      >
                        {match.status === "LIVE" && (
                          <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
                        )}
                        {timeDisplay}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm sm:text-base font-bold text-text-muted group-hover:text-primary transition-colors">
                        VS
                      </div>
                      <div className="text-xs font-medium mt-1 text-text-muted">{match.date}</div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
                  <span className="font-semibold text-sm sm:text-lg text-right text-text">{match.away.name}</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-sunken flex items-center justify-center font-bold text-text text-xs sm:text-sm">
                    {match.away.abbr}
                  </div>
                </div>
              </div>
            </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
