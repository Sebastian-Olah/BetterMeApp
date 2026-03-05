import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import { getGoals, getLogs, getPreferences, getJournalEntries } from '../utils/storage'
import type { Goal, DailyLog, JournalEntry, UserPreferences } from '../types/index'

// shape of the global app state
type AppState = {
  goals: Goal[]
  logs: DailyLog[]
  journalEntries: JournalEntry[]
  preferences: UserPreferences
}

// all possible actions that can update state
type AppAction =
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_LOGS'; payload: DailyLog[] }
  | { type: 'SET_JOURNAL'; payload: JournalEntry[] }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'RESET' }

// default preferences used when nothing is saved yet
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

const initialState: AppState = {
  goals: [],
  logs: [],
  journalEntries: [],
  preferences: defaultPreferences,
}

// reducer handles all state transitions based on action type
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_GOALS':
      return { ...state, goals: action.payload }
    case 'SET_LOGS':
      return { ...state, logs: action.payload }
    case 'SET_JOURNAL':
      return { ...state, journalEntries: action.payload }
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload }
    case 'RESET':
      // clear everything back to initial state
      return initialState
    default:
      return state
  }
}

type AppContextType = {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// provider wraps the app and loads all data from localStorage on mount
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    // load all persisted data into global state on first render
    dispatch({ type: 'SET_GOALS', payload: getGoals() })
    dispatch({ type: 'SET_LOGS', payload: getLogs() })
    dispatch({ type: 'SET_JOURNAL', payload: getJournalEntries() })
    dispatch({ type: 'SET_PREFERENCES', payload: getPreferences() })
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// custom hook for consuming context — throws if used outside provider
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}