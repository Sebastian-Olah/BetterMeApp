export type Goal = {
    id: string
    name: string
    category: 'Fitness' | 'Health' | 'Mindset' | 'Study' | 'Other'
    status: 'active' | 'inactive' | 'almost-over'
    frequency: 'Daily' | 'Weekly'
    startDate: string
    streak: number
    urgencyLevel: 'normal' | 'high'
    accountabilityLevel: 'Low' | 'Medium' | 'High'
    daysLeft?: number
    description?: string
  }
  
  export type DailyLog = {
    id: string
    goalId: string
    date: string
    completed: boolean
    imagePath?: string
  }
  
  export type JournalEntry = {
    id: string
    date: string
    content: string
    imagePath?: string
  }
  
  export type UserPreferences = {
    tone: string
    characteristics: {
      warm: number
      enthusiastic: number
      headerLists: number
      directness: number
    }
    collectData: boolean
    locationTracking: boolean
    notificationTime: string
    notificationsEnabled: boolean
    onboardingComplete: boolean
  }