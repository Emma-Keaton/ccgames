// Odum Eze mascot catalogue: sport -> pose + family ribbon.
// Cutouts built by scripts/build-mascot-assets.mjs into public/mascot/.
// Presented with CSS 3D tilt in components/brand/Mascot.tsx.
export type SportFamily = 'combat' | 'team' | 'racquet' | 'timed'
export const FAMILY_RIBBON: Record<SportFamily, string> = {
  combat: '#D8232A', team: '#6CB33F', racquet: '#121F8F', timed: '#F7A41E',
}
export const FAMILY_LABEL: Record<SportFamily, string> = {
  combat: 'Combat & Martial Arts', team: 'Team Sports',
  racquet: 'Racquet & Precision', timed: 'Timed, Measured & Judged',
}
const FAMILY_OF: Record<string, SportFamily> = {
  boxing: 'combat', judo: 'combat', taekwondo: 'combat',
  wrestling: 'combat', mma: 'combat',
  football: 'team', basketball: 'team', cricket: 'team',
  badminton: 'racquet', table_tennis: 'racquet', tennis: 'racquet',
  darts: 'racquet',
  athletics: 'timed', swimming: 'timed', cycling: 'timed',
  canoeing: 'timed', gymnastics: 'timed', golf: 'timed',
  shooting: 'timed', weightlifting: 'timed',
}
const POSE_OF: Record<string, string> = {
  football: 'mascot-football', basketball: 'mascot-basketball',
  boxing: 'mascot-boxing', badminton: 'mascot-badminton',
  table_tennis: 'mascot-table-tennis', tennis: 'mascot-tennis',
  golf: 'mascot-golf', athletics: 'mascot-athletics',
  cricket: 'mascot-hero', judo: 'mascot-boxing', taekwondo: 'mascot-boxing',
  wrestling: 'mascot-boxing', mma: 'mascot-boxing',
  swimming: 'mascot-base', cycling: 'mascot-base-alt',
  canoeing: 'mascot-base-alt', gymnastics: 'mascot-away-kit',
  shooting: 'mascot-base', weightlifting: 'mascot-away-kit',
  darts: 'mascot-base-alt',
}
export const MASCOT_HERO = '/mascot/mascot-hero.webp'
export const MASCOT_BASE = '/mascot/mascot-base.webp'
export function familyOfSport(code: string | null | undefined): SportFamily {
  if (!code) return 'team'
  return FAMILY_OF[code.toLowerCase()] ?? 'team'
}
export function ribbonOfSport(code: string | null | undefined): string {
  return FAMILY_RIBBON[familyOfSport(code)]
}
export function familyLabelOfSport(code: string | null | undefined): string {
  return FAMILY_LABEL[familyOfSport(code)]
}
export function mascotForSport(code: string | null | undefined): string {
  if (!code) return MASCOT_BASE
  return '/mascot/' + (POSE_OF[code.toLowerCase()] ?? 'mascot-hero') + '.webp'
}
export const SPORT_POSES: { code: string; label: string; src: string; ribbon: string }[] = [
  'football', 'basketball', 'cricket', 'boxing', 'judo', 'taekwondo',
  'wrestling', 'mma', 'badminton', 'table_tennis', 'tennis', 'darts',
  'athletics', 'swimming', 'cycling', 'canoeing', 'gymnastics', 'golf',
  'shooting', 'weightlifting',
].map((code) => ({ code, label: code.replace(/_/g, ' '),
  src: mascotForSport(code), ribbon: ribbonOfSport(code) }))
