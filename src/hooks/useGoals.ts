import { useCallback } from 'react'
import { getGoals, addGoal, updateGoal, deleteGoal, addLog } from '../utils/storage'
import { calculateStreak, isCompletedToday } from '../utils/streak'
import type { Goal } from '../types/index'

// encapsulates all goal-related operations in one reusable hook
export function useGoals() {
  // load goals from localStorage and attach calculated streaks
  const loadGoals = useCallback((): Goal[] => {
    const stored = getGoals()
    return stored.map(g => ({
      ...g,
      streak: calculateStreak(g.id)
    }))
  }, [])

  const createGoal = useCallback((goal: Goal) => {
    addGoal(goal)
  }, [])

  const editGoal = useCallback((goal: Goal) => {
    updateGoal(goal)
  }, [])

  const removeGoal = useCallback((id: string) => {
    deleteGoal(id)
  }, [])

  // marks a goal as complete for today — returns false if already done
  const completeGoal = useCallback((goalId: string) => {
    if (isCompletedToday(goalId)) return false
    addLog({
      id: Date.now().toString(),
      goalId,
      date: new Date().toISOString().split('T')[0],
      completed: true,
    })
    return true
  }, [])

  // returns only active and almost-over goals
  const getActiveGoals = useCallback((): Goal[] => {
    return loadGoals().filter(g => g.status === 'active' || g.status === 'almost-over')
  }, [loadGoals])

  const getGoalById = useCallback((id: string): Goal | undefined => {
    return loadGoals().find(g => g.id === id)
  }, [loadGoals])

  return {
    loadGoals,
    createGoal,
    editGoal,
    removeGoal,
    completeGoal,
    getActiveGoals,
    getGoalById,
  }
}