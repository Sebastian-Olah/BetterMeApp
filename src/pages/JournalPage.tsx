import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, Target, ChatCircle, Notebook, Gear, Plus, PencilSimple, Check, X, Camera} from '@phosphor-icons/react'
import { getJournalEntries, saveJournalEntries } from '../utils/storage'
import type { JournalEntry } from '../types/index'

export default function JournalPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showComposer, setShowComposer] = useState(false)
  const [newContent, setNewContent] = useState('')

  // editing state - tracks which entry is being edited
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  // photo state for new entry and edit mode
const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined)
const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined)

  // load entries from localStorage on mount
  useEffect(() => {
    setEntries(getJournalEntries())
  }, [])

  const today = new Date().toISOString().split('T')[0]

  // checks if an entry already exists for today
  const hasEntryToday = entries.some(e => e.date === today)

  const handleSave = () => {
    if (!newContent.trim()) return
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: today,
      content: newContent.trim(),
      imagePath: newPhoto,
    }
    const updated = [newEntry, ...entries]
    saveJournalEntries(updated)
    setEntries(updated)
    setNewContent('')
    setNewPhoto(undefined)
    setShowComposer(false)
  }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: today,
      content: newContent.trim(),
    }

    // prepend new entry so newest shows first
    const updated = [newEntry, ...entries]
    saveJournalEntries(updated)
    setEntries(updated)
    setNewContent('')
    setShowComposer(false)
  }

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setEditContent(entry.content)
  }

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return
    const updated = entries.map(e =>
      e.id === id ? { ...e, content: editContent.trim() } : e
    )
    saveJournalEntries(updated)
    setEntries(updated)
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

    // converts the selected image to a base64 string using FileReader
  // base64 strings can be stored directly in localStorage alongside the entry
  const handlePhotoCapture = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'new' | 'edit'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      if (mode === 'new') setNewPhoto(base64)
      else setEditPhoto(base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      backgroundColor: 'white', maxWidth: '430px', margin: '0 auto'
    }}>

      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#333333' }}>Journal</h1>
        {/* only show add button if no entry exists for today */}
        {!hasEntryToday && (
          <button
            onClick={() => setShowComposer(true)}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: '#FE7F3C', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            <Plus size={20} color="white" weight="bold" />
          </button>
        )}
      </div>

      {/* banner shown when today's entry is already written */}
      {hasEntryToday && (
        <div style={{
          margin: '0 24px 16px', padding: '12px 16px', borderRadius: '12px',
          backgroundColor: '#fff8f5', border: '1px solid #FE7F3C'
        }}>
          <p style={{ fontSize: '13px', color: '#FE7F3C', fontWeight: 500 }}>
            today's entry is written
          </p>
        </div>
      )}

      {/* composer - shown when user taps the plus button */}
      {showComposer && (
        <div style={{ padding: '0 24px 20px' }}>
          <p style={{ fontSize: '13px', color: '#999999', marginBottom: '8px' }}>
            {today}
          </p>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="how did today go? what are you working on?"
            rows={5}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              border: '1px solid #f0f0f0', fontSize: '14px', color: '#333333',
              outline: 'none', resize: 'none', fontFamily: 'inherit',
              lineHeight: '1.6', boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => { setShowComposer(false); setNewContent('') }}
              style={{
                flex: 1, padding: '12px', borderRadius: '999px',
                backgroundColor: '#f5f5f5', border: 'none',
                color: '#333333', fontWeight: 600, cursor: 'pointer'
              }}>
              cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1, padding: '12px', borderRadius: '999px',
                backgroundColor: newContent.trim() ? '#FE7F3C' : '#f0f0f0',
                border: 'none',
                color: newContent.trim() ? 'white' : '#999999',
                fontWeight: 600, cursor: 'pointer'
              }}>
              save entry
            </button>
          </div>
        </div>
      )}

      {/* entries list */}
      <div style={{ padding: '0 24px', flex: 1 }}>
        {entries.length === 0 && !showComposer && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <p style={{ fontSize: '16px', color: '#333333', fontWeight: 500, marginBottom: '8px' }}>
              no entries yet
            </p>
            <p style={{ fontSize: '14px', color: '#999999', marginBottom: '24px' }}>
              tap the plus button to write your first reflection
            </p>
          </div>
        )}

        {entries.map(entry => (
          <div
            key={entry.id}
            style={{
              padding: '16px', borderRadius: '12px', marginBottom: '12px',
              border: '1px solid #f0f0f0', backgroundColor: 'white'
            }}>
            {/* date and edit button row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', color: '#999999' }}>{entry.date}</p>
              {editingId !== entry.id && (
              // inline edit mode keeps editing within the card
                // avoids navigating to a separate edit screen which adds friction

                <button
                  onClick={() => handleStartEdit(entry)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px'
                  }}>
                  <PencilSimple size={16} color="#999999" />
                </button>
              )}
            </div>

            {editingId === entry.id ? (
              // inline edit mode - textarea pre-filled with existing content
              <>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '1px solid #f0f0f0', fontSize: '14px', color: '#333333',
                    outline: 'none', resize: 'none', fontFamily: 'inherit',
                    lineHeight: '1.6', boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleSaveEdit(entry.id)}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: '#FE7F3C', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    <Check size={16} color="white" weight="bold" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: '#f5f5f5', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    <X size={16} color="#999999" />
                  </button>
                </div>
              </>
            ) : (
              // read mode - just show the content
              <p style={{ fontSize: '14px', color: '#333333', lineHeight: '1.6' }}>
                {entry.content}
              </p>
            )}

            {/* show attached photo if one exists */}
            {entry.imagePath && (
              <img
                src={entry.imagePath}
                alt="journal attachment"
                style={{
                  width: '100%', borderRadius: '8px', marginTop: '12px',
                  objectFit: 'cover', maxHeight: '200px'
                }}
              />
            )}
          </div>
        ))}
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