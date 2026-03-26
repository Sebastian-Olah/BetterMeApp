import { getLogs } from './storage'

// tested with:
// - consecutive days - streak counts correctly
// - gap in the middle - streak stops at the gap
// - no completions - returns 0
// - completed today only - returns 1
// calculates how many consecutive days a goal has been completed
// counts backwards from today and stops at the first gap
export function calculateStreak(goalId: string): number {
  const logs = getLogs()

  // filter to only completed logs for this goal, get dates, sort newest first
  const completedDates = logs
    .filter(l => l.goalId === goalId && l.completed)
    .map(l => l.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (completedDates.length === 0) return 0

  let streak = 0
  const today = new Date()

  for (let i = 0; i < completedDates.length; i++) {
    // work out what date we expect at position i counting back from today
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]

    if (completedDates[i] === expectedStr) {
      // date matches — increment streak
      streak++
    } else {
      // gap found — stop counting
      break
    }
  }

  return streak
}

// checks whether a goal has already been completed today
export function isCompletedToday(goalId: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  const logs = getLogs()
  return logs.some(l => l.goalId === goalId && l.date === today && l.completed)
}
