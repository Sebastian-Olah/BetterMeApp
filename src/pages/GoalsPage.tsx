import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, Target, ChatCircle, Notebook, Gear, Plus, Trash, Fire, PencilSimple, Check } from '@phosphor-icons/react'
import { calculateStreak, isCompletedToday } from '../utils/streak'
import type { Goal } from '../types/index'
import { getGoals, addGoal, updateGoal, deleteGoal, addLog } from '../utils/storage'

export default function GoalsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [goals, setGoals] = useState<Goal[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [frequencyFilter, setFrequencyFilter] = useState<'All' | 'Daily' | 'Weekly'>('All')

  // state for the add goal modal form fields
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalCategory, setNewGoalCategory] = useState<Goal['category']>('Fitness')
  const [newGoalFrequency, setNewGoalFrequency] = useState<Goal['frequency']>('Daily')
  const [newGoalAccountability, setNewGoalAccountability] = useState<Goal['accountabilityLevel']>('Medium')

  // state for the edit goal modal - pre-filled with existing goal values
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editGoalName, setEditGoalName] = useState('')
  const [editGoalCategory, setEditGoalCategory] = useState<Goal['category']>('Fitness')
  const [editGoalFrequency, setEditGoalFrequency] = useState<Goal['frequency']>('Daily')
  const [editGoalAccountability, setEditGoalAccountability] = useState<Goal['accountabilityLevel']>('Medium')

  // load goals from localStorage and attach calculated streaks
  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = () => {
    // reads from localStorage and recalculates streaks on every load
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
  const handleAddGoal = () => {
    // dont save if name is empty
    if (!newGoalName.trim()) return
    const goal: Goal = {
      id: Date.now().toString(),
      name: newGoalName.trim(),
      category: newGoalCategory,
      status: 'active',
      frequency: newGoalFrequency,
      startDate: new Date().toISOString().split('T')[0],
      streak: 0,
      urgencyLevel: 'normal',
      accountabilityLevel: newGoalAccountability,
    }
    addGoal(goal)
    // reset form fields after saving
    setNewGoalName('')
    setNewGoalCategory('Fitness')
    setNewGoalFrequency('Daily')
    setNewGoalAccountability('Medium')
    setShowAddModal(false)
    loadGoals()
  }
  // opens the edit modal pre-filled with the goal's current values
const handleStartEdit = (goal: Goal) => {
  setEditingGoal(goal)
  setEditGoalName(goal.name)
  setEditGoalCategory(goal.category)
  setEditGoalFrequency(goal.frequency)
  setEditGoalAccountability(goal.accountabilityLevel)
}

const handleSaveEdit = () => {
  if (!editingGoal || !editGoalName.trim()) return
  const updated: Goal = {
    ...editingGoal,
    name: editGoalName.trim(),
    category: editGoalCategory,
    frequency: editGoalFrequency,
    accountabilityLevel: editGoalAccountability,
  }
  // replaces the existing goal object in localStorage
  updateGoal(updated)
  setEditingGoal(null)
  loadGoals()
}

  // filter goals by frequency -   all show everything, daily shows daily, weekly shows weekly
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
              {goal.streak > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Fire size={12} color="#FE7F3C" weight="fill" />
                  <p style={{ fontSize: '11px', color: '#FE7F3C', margin: 0 }}>
                    {goal.streak} day streak
                  </p>
                </div>
              ) : (
                // show a subtle label when no streak exists yet
                <p style={{ fontSize: '11px', color: '#999999', margin: '2px 0 0' }}>
                  no streak yet
                </p>
              )}
              {/* frequency badge shows daily or weekly at a glance */}
              <span style={{
                fontSize: '10px', color: '#999999', marginTop: '2px',
                backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '999px',
                display: 'inline-block'
              }}>
                {goal.frequency}
              </span>
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
                {completedToday ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    completed today
                    <Check size={16} color="#999999" weight="bold" aria-hidden />
                  </span>
                ) : (
                  'mark as complete'
                )}
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
              <button
                onClick={() => handleStartEdit(goal)}
                style={{
                  width: '44px', height: '44px', borderRadius: '999px',
                  backgroundColor: '#f5f5f5', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <PencilSimple size={16} color="#333333" />
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
          onClick={() => setShowAddModal(true)}
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
      {/* add goal modal - slides up from bottom */}
{showAddModal && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
  }}>
    <div style={{
      backgroundColor: 'white', borderRadius: '20px 20px 0 0',
      padding: '24px', width: '100%', maxWidth: '430px',
      zIndex: 1001, position: 'relative'
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333333', marginBottom: '20px' }}>
        add a new goal
      </h2>

      <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>goal name</p>
      <input
        value={newGoalName}
        onChange={e => setNewGoalName(e.target.value)}
        placeholder="e.g. go to the gym 5x a week"
        style={{
          width: '100%', padding: '12px 16px', borderRadius: '12px',
          border: '1px solid #f0f0f0', fontSize: '14px', color: '#333333',
          outline: 'none', marginBottom: '16px', boxSizing: 'border-box'
        }}
      />

      <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>category</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {(['Fitness', 'Health', 'Mindset', 'Study', 'Other'] as Goal['category'][]).map(cat => (
          <button
            key={cat}
            onClick={() => setNewGoalCategory(cat)}
            style={{
              padding: '8px 16px', borderRadius: '999px', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', border: 'none',
              backgroundColor: newGoalCategory === cat ? '#FE7F3C' : '#f5f5f5',
              color: newGoalCategory === cat ? 'white' : '#333333',
            }}>
            {cat}
          </button>
        ))}
      </div>
      {/* edit goal modal - same structure as add but pre-filled */}
      {editingGoal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px 20px 0 0',
            padding: '24px', width: '100%', maxWidth: '430px',
            zIndex: 1001
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333333', marginBottom: '20px' }}>
              edit goal
            </h2>

            <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>goal name</p>
            <input
              value={editGoalName}
              onChange={e => setEditGoalName(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                border: '1px solid #f0f0f0', fontSize: '14px', color: '#333333',
                outline: 'none', marginBottom: '16px', boxSizing: 'border-box'
              }}
            />

            <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>category</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {(['Fitness', 'Health', 'Mindset', 'Study', 'Other'] as Goal['category'][]).map(cat => (
                <button key={cat} onClick={() => setEditGoalCategory(cat)} style={{
                  padding: '8px 16px', borderRadius: '999px', fontSize: '13px',
                  fontWeight: 500, cursor: 'pointer', border: 'none',
                  backgroundColor: editGoalCategory === cat ? '#FE7F3C' : '#f5f5f5',
                  color: editGoalCategory === cat ? 'white' : '#333333',
                }}>{cat}</button>
              ))}
            </div>

            <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>frequency</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['Daily', 'Weekly'] as Goal['frequency'][]).map(freq => (
                <button key={freq} onClick={() => setEditGoalFrequency(freq)} style={{
                  flex: 1, padding: '8px', borderRadius: '999px', fontSize: '13px',
                  fontWeight: 500, cursor: 'pointer', border: 'none',
                  backgroundColor: editGoalFrequency === freq ? '#FE7F3C' : '#f5f5f5',
                  color: editGoalFrequency === freq ? 'white' : '#333333',
                }}>{freq}</button>
              ))}
            </div>

            <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>accountability level</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {(['Low', 'Medium', 'High'] as Goal['accountabilityLevel'][]).map(level => (
                <button key={level} onClick={() => setEditGoalAccountability(level)} style={{
                  flex: 1, padding: '8px', borderRadius: '999px', fontSize: '13px',
                  fontWeight: 500, cursor: 'pointer', border: 'none',
                  backgroundColor: editGoalAccountability === level ? '#FE7F3C' : '#f5f5f5',
                  color: editGoalAccountability === level ? 'white' : '#333333',
                }}>{level}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditingGoal(null)} style={{
                flex: 1, padding: '14px', borderRadius: '999px',
                backgroundColor: '#f5f5f5', border: 'none',
                color: '#333333', fontWeight: 600, cursor: 'pointer'
              }}>cancel</button>
              <button onClick={handleSaveEdit} style={{
                flex: 1, padding: '14px', borderRadius: '999px',
                backgroundColor: editGoalName.trim() ? '#FE7F3C' : '#f0f0f0',
                border: 'none',
                color: editGoalName.trim() ? 'white' : '#999999',
                fontWeight: 600, cursor: 'pointer'
              }}>save changes</button>
            </div>
          </div>
        </div>
      )}
      <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>frequency</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['Daily', 'Weekly'] as Goal['frequency'][]).map(freq => (
          <button
            key={freq}
            onClick={() => setNewGoalFrequency(freq)}
            style={{
              flex: 1, padding: '8px', borderRadius: '999px', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', border: 'none',
              backgroundColor: newGoalFrequency === freq ? '#FE7F3C' : '#f5f5f5',
              color: newGoalFrequency === freq ? 'white' : '#333333',
            }}>
            {freq}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '13px', color: '#999999', marginBottom: '6px' }}>accountability level</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['Low', 'Medium', 'High'] as Goal['accountabilityLevel'][]).map(level => (
          <button
            key={level}
            onClick={() => setNewGoalAccountability(level)}
            style={{
              flex: 1, padding: '8px', borderRadius: '999px', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', border: 'none',
              backgroundColor: newGoalAccountability === level ? '#FE7F3C' : '#f5f5f5',
              color: newGoalAccountability === level ? 'white' : '#333333',
            }}>
            {level}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setShowAddModal(false)}
          style={{
            flex: 1, padding: '14px', borderRadius: '999px',
            backgroundColor: '#f5f5f5', border: 'none',
            color: '#333333', fontWeight: 600, cursor: 'pointer'
          }}>
          cancel
        </button>
        <button
          onClick={handleAddGoal}
          style={{
            flex: 1, padding: '14px', borderRadius: '999px',
            backgroundColor: newGoalName.trim() ? '#FE7F3C' : '#f0f0f0',
            border: 'none',
            color: newGoalName.trim() ? 'white' : '#999999',
            fontWeight: 600, cursor: 'pointer'
          }}>
          add goal
        </button>
      </div>
    </div>
  </div>
)}

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