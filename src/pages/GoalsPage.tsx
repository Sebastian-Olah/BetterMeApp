import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, Target, ChatCircle, Notebook, Gear, Plus, Trash, Fire } from '@phosphor-icons/react'
import { getGoals, addGoal, deleteGoal, addLog } from '../utils/storage'
import { calculateStreak, isCompletedToday } from '../utils/streak'
import type { Goal } from '../types/index'

export default function GoalsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [frequencyFilter, setFrequencyFilter] = useState<'All' | 'Daily' | 'Weekly'>('All')

  // load goals from localStorage and attach calculated streaks
  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = () => {
    const stored = getGoals()
    const withStreaks = stored.map(g => ({
      ...g,
      streak: calculateStreak(g.id)
    }))
    setGoals(withStreaks)
  }

  const handleComplete = (goal: Goal) => {
    // prevent duplicate completions for the same day
    if (isCompletedToday(goal.id)) return
    addLog({
      id: Date.now().toString(),
      goalId: goal.id,
      date: new Date().toISOString().split('T')[0],
      completed: true,
    })
    loadGoals()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('delete this goal?')) {
      deleteGoal(id)
      loadGoals()
    }
  }

  // filter goals by frequency - all shows everything
  const filteredGoals = frequencyFilter === 'All'
    ? goals
    : goals.filter(g => g.frequency === frequencyFilter)

  // split into three sections for urgency-first ordering
  const almostOver = filteredGoals.filter(g => g.status === 'almost-over')
  const active = filteredGoals.filter(g => g.status === 'active')
  const inactive = filteredGoals.filter(g => g.status === 'inactive')

  // individual goal row component - defined inside page to access handlers
  const GoalRow = ({ goal }: { goal: Goal }) => {
    const isExpanded = expandedId === goal.id
    const completedToday = isCompletedToday(goal.id)

    return (
      <div style={{
        borderRadius: '12px', marginBottom: '8px', overflow: 'hidden',
        border: `1px solid ${goal.status === 'almost-over' ? '#FE7F3C' : '#f0f0f0'}`,
        backgroundColor: completedToday ? '#fff8f5' : 'white'
      }}>
        {/* tapping the row toggles expand - single expandedId means only one open at a time */}
        <div
          onClick={() => setExpandedId(isExpanded ? null : goal.id)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', cursor: 'pointer'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: goal.status === 'almost-over' ? '#FE7F3C'
                : goal.status === 'active' ? '#4CAF50' : '#999999'
            }} />
            <div>
              <span style={{
                fontSize: '14px', fontWeight: 500,
                color: goal.status === 'inactive' ? '#999999' : '#333333',
                textDecoration: completedToday ? 'line-through' : 'none'
              }}>
                {goal.name}
              </span>
              {goal.streak > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Fire size={12} color="#FE7F3C" weight="fill" />
                  <p style={{ fontSize: '11px', color: '#FE7F3C', margin: 0 }}>
                    {goal.streak} day streak
                  </p>
                </div>
              )}
            </div>
          </div>
          <span style={{
            fontSize: '11px', fontWeight: 500, padding: '4px 10px',
            borderRadius: '999px', marginLeft: '8px', whiteSpace: 'nowrap',
            backgroundColor: goal.status === 'almost-over' ? '#fff0e8'
              : goal.status === 'inactive' ? '#f5f5f5' : '#f0faf0',
            color: goal.status === 'almost-over' ? '#FE7F3C'
              : goal.status === 'inactive' ? '#999999' : '#4CAF50'
          }}>
            {goal.status === 'almost-over' ? `${goal.daysLeft}d left`
              : goal.status === 'inactive' ? 'Inactive' : 'Active'}
          </span>
        </div>

        {/* expanded section shows actions */}
        {isExpanded && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: '12px', color: '#999999', margin: '12px 0 4px' }}>
              category: {goal.category} - accountability: {goal.accountabilityLevel}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => handleComplete(goal)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '999px',
                  backgroundColor: completedToday ? '#f0f0f0' : '#FE7F3C',
                  color: completedToday ? '#999999' : 'white',
                  border: 'none', fontWeight: 600, fontSize: '14px',
                  cursor: completedToday ? 'default' : 'pointer'
                }}>
                {completedToday ? 'completed today ✓' : 'mark as complete'}
              </button>
              <button
                onClick={() => handleDelete(goal.id)}
                style={{
                  width: '44px', height: '44px', borderRadius: '999px',
                  backgroundColor: '#fff5f5', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <Trash size={16} color="#ff4444" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      backgroundColor: 'white', maxWidth: '430px', margin: '0 auto'
    }}>

      {/* header with add button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333333' }}>Goals</h1>
        <button
          onClick={() => {}}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#FE7F3C', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
          <Plus size={20} color="white" weight="bold" />
        </button>
      </div>

      {/* frequency filter pills */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 24px', marginBottom: '16px' }}>
        {(['All', 'Daily', 'Weekly'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setFrequencyFilter(filter)}
            style={{
              padding: '6px 16px', borderRadius: '999px', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer', border: 'none',
              backgroundColor: frequencyFilter === filter ? '#FE7F3C' : '#f5f5f5',
              color: frequencyFilter === filter ? 'white' : '#333333',
            }}>
            {filter}
          </button>
        ))}
      </div>

      {/* goals list */}
      <div style={{ padding: '0 24px', flex: 1 }}>
        {goals.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <p style={{ fontSize: '16px', color: '#333333', fontWeight: 500, marginBottom: '8px' }}>
              no goals yet
            </p>
            <p style={{ fontSize: '14px', color: '#999999', marginBottom: '24px' }}>
              add your first goal or ask your AI coach to create one for you
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

        {almostOver.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#FE7F3C', marginBottom: '8px', letterSpacing: '0.5px' }}>
              ALMOST OVER
            </p>
            {almostOver.map(goal => <GoalRow key={goal.id} goal={goal} />)}
          </div>
        )}

        {active.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#999999', marginBottom: '8px', letterSpacing: '0.5px' }}>
              ACTIVE GOALS
            </p>
            {active.map(goal => <GoalRow key={goal.id} goal={goal} />)}
          </div>
        )}

        {inactive.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#999999', marginBottom: '8px', letterSpacing: '0.5px' }}>
              INACTIVE GOALS
            </p>
            {inactive.map(goal => <GoalRow key={goal.id} goal={goal} />)}
          </div>
        )}
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