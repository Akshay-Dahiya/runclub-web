// ─────────────────────────────────────────────────────────────────────────────
//  RunClub — Single Source of Truth
//  Training plans + participant roster for Delhi RunClub Aug 23, 2026 race
// ─────────────────────────────────────────────────────────────────────────────

export const RACE_DATE = new Date('2026-08-23T07:00:00+05:30')

// Week start dates (Monday). Plan runs Tue / Thu / Sat / Sun each week.
export const WEEK_STARTS: Date[] = [
  new Date('2026-06-08'), // Week 1
  new Date('2026-06-15'), // Week 2
  new Date('2026-06-22'), // Week 3
  new Date('2026-06-29'), // Week 4
  new Date('2026-07-06'), // Week 5
  new Date('2026-07-13'), // Week 6
  new Date('2026-07-20'), // Week 7
  new Date('2026-07-27'), // Week 8
  new Date('2026-08-03'), // Week 9
  new Date('2026-08-10'), // Week 10
]

export interface WeekPlan {
  week: number
  label: string
  tue: number
  thu: number
  sat: number
  sun: number
  total: number
}

// 10-Week plan for 10.5K runners
export const PLAN_10K: WeekPlan[] = [
  { week: 1,  label: '8–14 Jun',     tue: 4, thu: 4, sat: 5, sun: 5,  total: 18 },
  { week: 2,  label: '15–21 Jun',    tue: 5, thu: 5, sat: 5, sun: 5,  total: 20 },
  { week: 3,  label: '22–28 Jun',    tue: 5, thu: 5, sat: 5, sun: 7,  total: 22 },
  { week: 4,  label: '29–5 Jul',     tue: 5, thu: 7, sat: 5, sun: 8,  total: 25 },
  { week: 5,  label: '6–12 Jul',     tue: 5, thu: 8, sat: 7, sun: 8,  total: 28 },
  { week: 6,  label: '13–19 Jul',    tue: 7, thu: 8, sat: 7, sun: 10, total: 32 },
  { week: 7,  label: '20–26 Jul',    tue: 7, thu: 7, sat: 6, sun: 8,  total: 28 },
  { week: 8,  label: '27 Jul–2 Aug', tue: 5, thu: 6, sat: 6, sun: 7,  total: 24 },
  { week: 9,  label: '3–9 Aug',      tue: 5, thu: 6, sat: 6, sun: 7,  total: 24 },
  { week: 10, label: '10–16 Aug',    tue: 4, thu: 4, sat: 5, sun: 5,  total: 18 },
]
// Total: 239 km

// 10-Week plan for 21.1K (Half Marathon) runners - Intermediate
export const PLAN_HM_INT: WeekPlan[] = [
  { week: 1,  label: '8–14 Jun',     tue: 6, thu: 7,  sat: 7, sun: 10, total: 30 },
  { week: 2,  label: '15–21 Jun',    tue: 8, thu: 8,  sat: 8, sun: 10, total: 34 },
  { week: 3,  label: '22–28 Jun',    tue: 8, thu: 10, sat: 8, sun: 12, total: 38 },
  { week: 4,  label: '29–5 Jul',     tue: 8, thu: 10, sat: 8, sun: 15, total: 41 },
  { week: 5,  label: '6–12 Jul',     tue: 8, thu: 10, sat: 8, sun: 17, total: 43 },
  { week: 6,  label: '13–19 Jul',    tue: 8, thu: 10, sat: 8, sun: 20, total: 46 },
  { week: 7,  label: '20–26 Jul',    tue: 8, thu: 8,  sat: 8, sun: 15, total: 39 },
  { week: 8,  label: '27 Jul–2 Aug', tue: 7, thu: 8,  sat: 7, sun: 12, total: 34 },
  { week: 9,  label: '3–9 Aug',      tue: 7, thu: 7,  sat: 7, sun: 12, total: 33 },
  { week: 10, label: '10–16 Aug',    tue: 6, thu: 7,  sat: 7, sun: 10, total: 30 },
]
// Total: 368 km

// 10-Week plan for 21.1K (Half Marathon) runners - Beginner
export const PLAN_HM_BEG: WeekPlan[] = [
  { week: 1,  label: '8–14 Jun',     tue: 6, thu: 6,  sat: 6, sun: 7,  total: 25 },
  { week: 2,  label: '15–21 Jun',    tue: 7, thu: 7,  sat: 6, sun: 8,  total: 28 },
  { week: 3,  label: '22–28 Jun',    tue: 7, thu: 8,  sat: 8, sun: 9,  total: 32 },
  { week: 4,  label: '29–5 Jul',     tue: 9, thu: 9,  sat: 8, sun: 10, total: 36 },
  { week: 5,  label: '6–12 Jul',     tue: 9, thu: 10, sat: 8, sun: 12, total: 39 },
  { week: 6,  label: '13–19 Jul',    tue: 9, thu: 10, sat: 9, sun: 15, total: 43 },
  { week: 7,  label: '20–26 Jul',    tue: 9, thu: 10, sat: 8, sun: 12, total: 39 },
  { week: 8,  label: '27 Jul–2 Aug', tue: 9, thu: 9,  sat: 8, sun: 10, total: 36 },
  { week: 9,  label: '3–9 Aug',      tue: 8, thu: 8,  sat: 7, sun: 9,  total: 32 },
  { week: 10, label: '10–16 Aug',    tue: 7, thu: 7,  sat: 7, sun: 9,  total: 30 },
]
// Total: 340 km

export type RaceCategory = 'HM_INT' | 'HM_BEG' | '10K'

export interface Participant {
  id: number
  name: string
  initials: string
  email: string
  cat: RaceCategory
}

// Official registered participants
export const PARTICIPANTS: Participant[] = [
  { id: 1,  name: 'Naresh Grover',   initials: 'NG',  email: 'grovernaresh@yahoo.com',        cat: 'HM_INT'  },
  { id: 2,  name: 'Ramesh Krishnan', initials: 'RK',  email: 'ramesh.krishnan2974@gmail.com', cat: '10K' },
  { id: 3,  name: 'Aditya Arya',     initials: 'AA',  email: 'aditya.arya.civil@gmail.com',   cat: 'HM_INT'  },
  { id: 4,  name: 'Arvind Chauhan',  initials: 'AC',  email: 'chauhan_arvind80@yahoo.com',    cat: '10K' },
  { id: 5,  name: 'Vikram Singh',    initials: 'VS',  email: 'vikramhari@gmail.com',           cat: 'HM_INT'  },
  { id: 6,  name: 'Anup Kaushik',    initials: 'AK',  email: 'anupkaushik44459@gmail.com',    cat: '10K' },
  { id: 7,  name: 'Akshay Dahiya',   initials: 'AD',  email: 'akshaydahiya2004@gmail.com',    cat: 'HM_INT'  },
  { id: 8,  name: 'Aditi Dahiya',    initials: 'ADi', email: 'aditidahiya2004@gmail.com',     cat: '10K' },
  { id: 9,  name: 'Geeta Dahiya',    initials: 'GD',  email: 'geetabura80@gmail.com',          cat: '10K' },
  { id: 10, name: 'Rishabh Mishra',  initials: 'RM',  email: 'rishab.mishra@gmail.com',       cat: 'HM_INT'  },
  { id: 11, name: 'Rajat Tiwari',    initials: 'RT',  email: 'rajat@runclub.local',           cat: '10K' },
  { id: 12, name: 'Rohit Anand',     initials: 'RA',  email: 'rohit@runclub.local',           cat: '10K' },
  { id: 13, name: 'Aryan Chaudhary', initials: 'AC',  email: 'aryan@runclub.local',           cat: 'HM_INT'  },
  { id: 14, name: 'Anurag Goel',     initials: 'AG',  email: 'anurag@runclub.local',          cat: '10K' },
  { id: 15, name: 'Mukesh Kandol',   initials: 'MK',  email: 'mukesh@runclub.local',          cat: 'HM_INT' },
]

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns 0-based week index for a given date string/Date, or -1 if before plan */
export function getWeekIdx(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  for (let i = WEEK_STARTS.length - 1; i >= 0; i--) {
    if (d >= WEEK_STARTS[i]) return i
  }
  return -1
}

/** Returns the current week index (0-9), or -1 if outside the plan */
export function currentWeekIdx(): number {
  return getWeekIdx(new Date())
}

/** Get the correct plan array for a participant */
export function getPlan(p: Participant): WeekPlan[] {
  if (p.cat === 'HM_INT') return PLAN_HM_INT
  if (p.cat === 'HM_BEG') return PLAN_HM_BEG
  return PLAN_10K
}

/** Grand total km for the full plan */
export function grandTotal(p: Participant): number {
  if (p.cat === 'HM_INT') return 368
  if (p.cat === 'HM_BEG') return 340
  return 239
}

/** Planned km through the current week (inclusive), prorated by day */
export function plannedKmSoFar(p: Participant): number {
  const cwi = Math.min(currentWeekIdx(), 9)
  if (cwi < 0) return 0
  
  const plan = getPlan(p)
  // Sum up fully completed past weeks
  let total = plan.slice(0, cwi).reduce((s, w) => s + w.total, 0)
  
  // Prorate the current week based on the current day
  const currentWeekPlan = plan[cwi]
  const dayIdx = (new Date().getDay() + 6) % 7 // Monday = 0, Sunday = 6
  
  if (dayIdx >= 1) total += currentWeekPlan.tue // Tue (index 1)
  if (dayIdx >= 3) total += currentWeekPlan.thu // Thu (index 3)
  if (dayIdx >= 5) total += currentWeekPlan.sat // Sat (index 5)
  if (dayIdx >= 6) total += currentWeekPlan.sun // Sun (index 6)
  
  return total
}

/** Traffic-light status based on actual vs expected km */
export type TrafficLight = 'green' | 'yellow' | 'red'
export function getStatus(actualKm: number, p: Participant): TrafficLight {
  const planned = plannedKmSoFar(p)
  if (planned === 0) return 'green'
  const ratio = actualKm / planned
  if (ratio >= 0.60) return 'green'
  if (ratio >= 0.30) return 'yellow'
  return 'red'
}

/** Map participant email → participant (useful for seeding/lookups) */
export const participantByEmail = new Map(
  PARTICIPANTS.filter(p => p.email).map(p => [p.email, p])
)
