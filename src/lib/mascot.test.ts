import { describe, expect, it } from 'vitest'
import {
  SPORT_POSES,
  familyLabelOfSport,
  familyOfSport,
  mascotForSport,
  ribbonOfSport,
} from '@/lib/mascot'

describe('mascot catalogue', () => {
  it('covers all 20 catalogue sports', () => {
    expect(SPORT_POSES).toHaveLength(20)
  })
  it('maps families and ribbons per DESIGN.md', () => {
    expect(familyOfSport('boxing')).toBe('combat')
    expect(ribbonOfSport('boxing')).toBe('#D8232A')
    expect(familyOfSport('football')).toBe('team')
    expect(ribbonOfSport('football')).toBe('#6CB33F')
    expect(familyOfSport('tennis')).toBe('racquet')
    expect(ribbonOfSport('tennis')).toBe('#121F8F')
    expect(familyOfSport('athletics')).toBe('timed')
    expect(ribbonOfSport('athletics')).toBe('#F7A41E')
    expect(familyLabelOfSport('golf')).toContain('Timed')
  })
  it('resolves a webp pose per sport with fallbacks', () => {
    expect(mascotForSport('football')).toBe('/mascot/mascot-football.webp')
    expect(mascotForSport('boxing')).toBe('/mascot/mascot-boxing.webp')
    expect(mascotForSport(null)).toBe('/mascot/mascot-base.webp')
    expect(mascotForSport('unknown-code')).toBe('/mascot/mascot-hero.webp')
    for (const pose of SPORT_POSES) expect(pose.src.endsWith('.webp')).toBe(true)
  })
})
