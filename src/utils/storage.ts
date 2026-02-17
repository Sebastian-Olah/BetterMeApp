import type { Goal, DailyLog, JournalEntry, UserPreferences } from '../types/index'

// storage keys — namespaced to avoid collisions with other apps
const GOALS_KEY = 'better_me_goals'
const LOGS_KEY = 'better_me_logs'
const JOURNAL_KEY = 'better_me_journal'
const PREFERENCES_KEY = 'better_me_preferences'

// default preferences used when no saved preferences exist
const defaultPreferences: UserPreferences = {
  tone: 'Balanced',
  characteristics: {
    warm: 50,
    enthusiastic: 50,
    headerLists: 50,
    directness: 50,
  },
  collectData: false,
  locationTracking: false,
  notificationTime: '09:00',
  notificationsEnabled: false,
  onboardingComplete: false,
}

// --- goals ---

export function getGoals(): Goal[] {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveGoals(goals: Goal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

export function addGoal(goal: Goal): void {
  // append new goal to existing list
  const goals = getGoals()
  saveGoals([...goals, goal])
}

export function updateGoal(updated: Goal): void {
  // replace the matching goal by id
  const goals = getGoals()
  saveGoals(goals.map(g => g.id === updated.id ? updated : g))
}

export function deleteGoal(id: string): void {
  // filter out the goal with the given id
  const goals = getGoals()
  saveGoals(goals.filter(g => g.id !== id))
}

// --- logs ---

export function getLogs(): DailyLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveLogs(logs: DailyLog[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

export function addLog(log: DailyLog): void {
  // append new completion log to existing logs
  const logs = getLogs()
  saveLogs([...logs, log])
}

// --- journal ---

export function getJournalEntries(): JournalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveJournalEntries(entries: JournalEntry[]): void {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries))
}

// --- preferences ---

export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    // merge stored preferences with defaults to handle missing fields
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences
  } catch {
    return defaultPreferences
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
}

// --- clear all ---

export function clearAllData(): void {
  // wipe everything — used by the clear data button in settings
  localStorage.removeItem(GOALS_KEY)
  localStorage.removeItem(LOGS_KEY)
  localStorage.removeItem(JOURNAL_KEY)
  localStorage.removeItem(PREFERENCES_KEY)
  localStorage.removeItem('better_me_chat')
}