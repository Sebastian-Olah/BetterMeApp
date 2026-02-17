import { useCallback } from 'react'
import { calculateStreak, isCompletedToday } from '../utils/streak'

// provides streak-related helper functions for use in components
export function useStreak() {
  const getStreak = useCallback((goalId: string): number => {
    return calculateStreak(goalId)
  }, [])

  const completedToday = useCallback((goalId: string): boolean => {
    return isCompletedToday(goalId)
  }, [])

  // returns a human readable streak label
  const getStreakLabel = useCallback((streak: number): string => {
    if (streak === 0) return 'no streak yet'
    if (streak === 1) return '1 day streak'
    return `${streak} day streak`
  }, [])

  return {
    getStreak,
    completedToday,
    getStreakLabel,
  }
}