import { useCallback } from 'react'
import { getGoals } from '../utils/storage'

// handles browser notification permission and scheduling
export function useNotifications() {
  // requests browser notification permission from the user
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  // schedules notifications based on the user's chosen time and accountability level
  const scheduleNotification = useCallback((time: string) => {
    if (Notification.permission !== 'granted') return

    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)

    // if the target time has already passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }

    const delay = target.getTime() - now.getTime()

    // find the highest accountability level across all active goals
    const goals = getGoals()
    const highestLevel = goals.some(g => g.accountabilityLevel === 'High') ? 'High'
      : goals.some(g => g.accountabilityLevel === 'Medium') ? 'Medium' : 'Low'

    // low = 1 notification, medium = 2, high = 3
    const notificationCount = highestLevel === 'High' ? 3
      : highestLevel === 'Medium' ? 2 : 1

    // messages get progressively more direct
    const messages = [
      "time to check in with your goals. how's it going?",
      "don't forget — you made a commitment. check in now.",
      "this is your final reminder. no excuses."
    ]

    // schedule each notification 2 hours apart
    for (let i = 0; i < notificationCount; i++) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Better Me', {
            body: messages[i],
            icon: '/pwa-192x192.png'
          })
        }
      }, delay + (i * 2 * 60 * 60 * 1000))
    }
  }, [])

  const isSupported = useCallback((): boolean => {
    return 'Notification' in window
  }, [])

  const isGranted = useCallback((): boolean => {
    return Notification.permission === 'granted'
  }, [])

  return {
    requestPermission,
    scheduleNotification,
    isSupported,
    isGranted,
  }
}