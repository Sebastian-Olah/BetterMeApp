import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, Target, ChatCircle, Notebook, Gear, Fire } from '@phosphor-icons/react'// phosphor icons used as react components so colour and weight can be controlled via props
                                                                              // svg file imports were tried first but had hardcoded fill colours that overrode css filters
import { getGoals, addLog } from '../utils/storage'
import { calculateStreak, isCompletedToday } from '../utils/streak'
import type { Goal } from '../types/index'

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<Goal[]>([])

  // reload goals every time the dashboard becomes the active screen
  // this ensures completions made on other screens are reflected immediately
  useEffect(() => {
    const stored = getGoals()
    const withStreaks = stored.map(g => ({
      ...g,
      streak: calculateStreak(g.id)
    }))
    setGoals(withStreaks)
  }, [location])

  // calculate today's completion progress for the progress bar
  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'almost-over')
  const completedToday = activeGoals.filter(g => isCompletedToday(g.id))
  const progressPercent = activeGoals.length > 0
    ? Math.round((completedToday.length / activeGoals.length) * 100)
    : 0

  // marks a goal as complete for today and reloads the list
  const handleComplete = (goal: Goal) => {
    if (isCompletedToday(goal.id)) return
    addLog({
      id: Date.now().toString(),
      goalId: goal.id,
      date: new Date().toISOString().split('T')[0],
      completed: true,
    })
    setGoals(prev => prev.map(g =>
      g.id === goal.id ? { ...g, streak: calculateStreak(g.id) } : g
    ))
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      backgroundColor: 'white', maxWidth: '430px', margin: '0 auto'
    }}>

      {/* greeting and progress bar */}
      <div style={{ padding: '24px 24px 16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#333333', marginBottom: '4px' }}>
          good morning 👋
        </h1>
        <p style={{ fontSize: '14px', color: '#999999', marginBottom: '16px' }}>
          {completedToday.length} of {activeGoals.length} goals done today
        </p>

        {/* progress bar fills proportionally based on completions */}
        <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '999px' }}>
          <div style={{
            height: '100%', borderRadius: '999px',
            backgroundColor: '#FE7F3C',
            width: `${progressPercent}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* ai coach shortcut card */}
      <div
        onClick={() => navigate('/chat')}
        style={{
          margin: '0 24px 24px', padding: '16px 20px', borderRadius: '16px',
          backgroundColor: '#FE7F3C', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
            chat with your coach
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            how are you getting on today?
          </p>
        </div>
        <ChatCircle size={28} color="white" weight="fill" />
      </div>

      {/* today's goals list */}
      <div style={{ padding: '0 24px', flex: 1 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#999999', marginBottom: '12px', letterSpacing: '0.5px' }}>
          TODAY'S GOALS
        </p>

        {goals.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ fontSize: '14px', color: '#999999', marginBottom: '16px' }}>
              no goals yet — talk to your coach to get started
            </p>
            <button
              onClick={() => navigate('/chat')}
              style={{
                padding: '12px 24px', borderRadius: '999px',
                backgroundColor: '#FE7F3C', border: 'none',
                color: 'white', fontWeight: 600, cursor: 'pointer'
              }}>
              talk to your coach
            </button>
          </div>
        )}

        {activeGoals.map(goal => {
          const done = isCompletedToday(goal.id)
          return (
            <div
              key={goal.id}
              style={{
                padding: '14px 16px', borderRadius: '12px', marginBottom: '10px',
                border: `1px solid ${done ? '#FE7F3C' : '#f0f0f0'}`,
                backgroundColor: done ? '#fff8f5' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
              <div>
                <p style={{
                  fontSize: '14px', fontWeight: 500,
                  color: '#333333',
                  textDecoration: done ? 'line-through' : 'none'
                }}>
                  {goal.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#999999' }}>{goal.category}</span>
                  {goal.streak > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Fire size={11} color="#FE7F3C" weight="fill" />
                      <span style={{ fontSize: '11px', color: '#FE7F3C' }}>{goal.streak} days</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleComplete(goal)}
                style={{
                  padding: '8px 14px', borderRadius: '999px', fontSize: '12px',
                  fontWeight: 600, border: 'none', cursor: done ? 'default' : 'pointer',
                  backgroundColor: done ? '#f0f0f0' : '#FE7F3C',
                  color: done ? '#999999' : 'white'
                }}>
                {done ? 'done ✓' : 'complete'}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ height: '80px' }} />

      {/* bottom navigation bar — fixed to viewport bottom */}
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
          // useLocation makes isActive reactive — window.location would not update on navigation
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