import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, Target, ChatCircle, Notebook, Gear, Bell, Palette, Lock, Trash } from '@phosphor-icons/react'
import { getPreferences, savePreferences, clearAllData, getGoals } from '../utils/storage'

export default function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationTime, setNotificationTime] = useState('09:00')

  // load saved preferences on mount
  useEffect(() => {
    const prefs = getPreferences()
    setNotificationsEnabled(prefs.notificationsEnabled)
    setNotificationTime(prefs.notificationTime)
  }, [])

  // schedules browser notifications based on accountability level
  // low = 1 notification, medium = 2, high = 3, each 2 hours apart
  const scheduleNotification = (time: string) => {
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

    const notificationCount = highestLevel === 'High' ? 3
      : highestLevel === 'Medium' ? 2 : 1

    // messages get progressively more direct
    const messages = [
      "time to check in with your goals. how's it going?",
      "don't forget - you made a commitment. check in now.",
      "this is your final reminder. no excuses."
    ]

    // schedule each notification 2 hours apart using setTimeout
    // limitation: setTimeout requires the browser tab to be open
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
  }

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      // request browser permission when enabling
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        savePreferences({ ...getPreferences(), notificationsEnabled: true, notificationTime })
        scheduleNotification(notificationTime)
      }
    } else {
      setNotificationsEnabled(false)
      savePreferences({ ...getPreferences(), notificationsEnabled: false })
    }
  }

  const handleTimeChange = (time: string) => {
    setNotificationTime(time)
    savePreferences({ ...getPreferences(), notificationTime: time })
    if (notificationsEnabled) {
      scheduleNotification(time)
    }
  }

  const handleClearData = () => {
    // browser confirmation dialog prevents accidental deletion
    if (window.confirm('this will delete all your goals, journal entries and chat history. are you sure?')) {
      clearAllData()
      navigate('/')
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      backgroundColor: 'white', maxWidth: '430px', margin: '0 auto'
    }}>

      {/* header */}
      <div style={{ padding: '20px 24px 16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#333333' }}>Settings</h1>
      </div>

      <div style={{ padding: '0 24px', flex: 1 }}>

        {/* notifications section */}
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#999999', marginBottom: '12px', letterSpacing: '0.5px' }}>
          NOTIFICATIONS
        </p>

        <div style={{
          borderRadius: '16px', border: '1px solid #f0f0f0',
          marginBottom: '24px', overflow: 'hidden'
        }}>
          {/* notification toggle row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={20} color="#FE7F3C" />
              <span style={{ fontSize: '14px', color: '#333333' }}>daily reminder</span>
            </div>
            {/* custom toggle */}
            <div
              onClick={handleNotificationToggle}
              style={{
                width: '44px', height: '24px', borderRadius: '999px',
                backgroundColor: notificationsEnabled ? '#FE7F3C' : '#e0e0e0',
                cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s'
              }}>
              <div style={{
                position: 'absolute', top: '2px',
                left: notificationsEnabled ? '22px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: 'white', transition: 'left 0.2s'
              }} />
            </div>
          </div>

          {/* time picker - only shown when notifications are enabled */}
          {notificationsEnabled && (
            <div style={{
              padding: '12px 16px', borderTop: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', color: '#333333' }}>reminder time</span>
              <input
                type="time"
                value={notificationTime}
                onChange={e => handleTimeChange(e.target.value)}
                style={{
                  border: 'none', outline: 'none', fontSize: '14px',
                  fontWeight: 600, color: '#FE7F3C', backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              />
            </div>
          )}
        </div>

        {/* preferences section */}
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#999999', marginBottom: '12px', letterSpacing: '0.5px' }}>
          PREFERENCES
        </p>

        <div style={{
          borderRadius: '16px', border: '1px solid #f0f0f0',
          marginBottom: '24px'
        }}>
          {/* ai personality row - navigates to personalisation screen */}
          <div
            onClick={() => navigate('/personalisation')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', cursor: 'pointer'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Palette size={20} color="#FE7F3C" />
              <span style={{ fontSize: '14px', color: '#333333' }}>AI personality</span>
            </div>
            <span style={{ fontSize: '14px', color: '#999999' }}>{'>'}</span>
          </div>
        </div>

        {/* privacy section */}
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#999999', marginBottom: '12px', letterSpacing: '0.5px' }}>
          PRIVACY
        </p>

        <div style={{
          borderRadius: '16px', border: '1px solid #f0f0f0',
          marginBottom: '24px'
        }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Lock size={20} color="#FE7F3C" />
              <span style={{ fontSize: '14px', color: '#333333' }}>data storage</span>
            </div>
            <p style={{ fontSize: '12px', color: '#999999', marginLeft: '32px' }}>
              all data is stored locally on your device. nothing is sent to external servers except text sent to the AI.
            </p>
          </div>
        </div>

        {/* data section */}
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#999999', marginBottom: '12px', letterSpacing: '0.5px' }}>
          DATA
        </p>

        <div style={{
          borderRadius: '16px', border: '1px solid #f0f0f0',
          marginBottom: '24px'
        }}>
          {/* clear all data button */}
          <div
            onClick={handleClearData}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px', cursor: 'pointer'
            }}>
            <Trash size={20} color="#ff4444" />
            <span style={{ fontSize: '14px', color: '#ff4444' }}>clear all data</span>
          </div>
        </div>

        {/* version info at bottom */}
        <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', marginTop: '8px' }}>
          better me v1.0.0 - all data stored locally
        </p>
      </div>

      <div style={{ height: '80px' }} />

      {/* bottom navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px', backgroundColor: 'white',
        borderTop: '1px solid #f0f0f0', display: 'flex',
        justifyContent: 'space-around', padding: '12px 0'
      }}>
        {[
          { label: 'Home', path: '/dashboard', icon: House },
          { label: 'Goals', path: '/goals', icon: Target },
          { label: 'Chat', path: '/chat', icon: ChatCircle },
          { label: 'Journal', path: '/journal', icon: Notebook },
          { label: 'Settings', path: '/settings', icon: Gear },
        ].map(item => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '4px', background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 12px'
              }}>
              <Icon size={28} color={isActive ? '#FE7F3C' : '#999999'} weight={isActive ? 'fill' : 'regular'} />
              <span style={{ fontSize: '10px', color: isActive ? '#FE7F3C' : '#999999' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}