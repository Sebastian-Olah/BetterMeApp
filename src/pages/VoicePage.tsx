import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Microphone, Pause, X, Play, ArrowClockwise, PaperPlaneTilt, House, Target, ChatCircle, Notebook, Gear } from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
import { addGoal, getJournalEntries, getPreferences, getGoals } from '../utils/storage'
import { calculateStreak } from '../utils/streak'
import { sendMessage as sendToAI, buildSystemPrompt } from '../services/openai'

// message type shared with chat screen
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// shared storage key - voice and chat screens both read and write to this key
// so conversation history is continuous regardless of which screen the user is on
const CHAT_STORAGE_KEY = 'better_me_chat'

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "hi, how can i assist you today?",
    timestamp: new Date()
  }
]

export default function VoicePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isListening, setIsListening] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // hasStarted controls which view is shown - large circle or conversation view
  const [hasStarted, setHasStarted] = useState(false)

  // restore shared conversation history from localStorage on mount
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    return stored ? JSON.parse(stored) : initialMessages
  })

  // refs used because event handlers inside useEffect closures cannot read current state
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const pausedTextRef = useRef('')
  const isSendingRef = useRef(false)
  const isListeningRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // persist shared conversation history on every change
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      backgroundColor: 'white', maxWidth: '430px', margin: '0 auto'
    }}>

      {/* header */}
      <div style={{
        padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#333333', marginBottom: '2px' }}>
            Smart Voice
          </h1>
          <p style={{ fontSize: '12px', color: '#999999' }}>your personal AI coach</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X size={28} color="#999999" />
        </button>
      </div>

      {/* messages area - shows large circle before first message, conversation after */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 24px',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {!hasStarted && messages.length <= 1 ? (
          // initial state - large orange circle as primary interaction element
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: '32px'
          }}>
            <div
              onClick={() => {}}
              style={{
                width: '180px', height: '180px', borderRadius: '50%',
                backgroundColor: '#FE7F3C', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isListening
                  ? '0 0 0 20px rgba(254,127,60,0.15), 0 0 0 40px rgba(254,127,60,0.08)'
                  : 'none',
                transition: 'box-shadow 0.4s ease'
              }}>
              <Microphone size={60} color="white" weight="fill" />
            </div>
            <p style={{ fontSize: '14px', color: '#999999', textAlign: 'center' }}>
              tap the circle to start speaking
            </p>
          </div>
        ) : (
          // conversation state - same bubble layout as chat screen
          <>
            {messages.map(message => (
              <div key={message.id} style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
                  borderBottomLeftRadius: message.role === 'assistant' ? '4px' : '16px',
                  borderBottomRightRadius: message.role === 'user' ? '4px' : '16px',
                  backgroundColor: message.role === 'user' ? '#FE7F3C' : '#f5f5f5',
                  color: message.role === 'user' ? 'white' : '#333333',
                  fontSize: '14px', lineHeight: '1.5'
                }}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '16px', borderBottomLeftRadius: '4px',
                  backgroundColor: '#f5f5f5', display: 'flex', gap: '4px', alignItems: 'center'
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: '#999999'
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* live transcript shown as faded bubble while user is speaking */}
            {transcript && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
                  borderBottomRightRadius: '4px',
                  backgroundColor: 'rgba(254,127,60,0.2)',
                  fontSize: '14px', color: '#333333', fontStyle: 'italic'
                }}>
                  {transcript}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* voice controls */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '24px', marginBottom: '70px'
      }}>
        <button onClick={() => {}} style={{
          width: '48px', height: '48px', borderRadius: '50%',
          backgroundColor: isPaused ? '#FE7F3C' : '#f5f5f5',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isPaused
            ? <Play size={20} color="white" weight="fill" />
            : <Pause size={20} color="#333333" weight="fill" />}
        </button>

        {/* main mic button - dark when listening to signal tap will send */}
        <button onClick={() => {}} style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: isListening ? '#333333' : '#FE7F3C',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}>
          {isListening
            ? <PaperPlaneTilt size={22} color="white" weight="fill" />
            : <Microphone size={22} color="white" weight="fill" />}
        </button>

        <button onClick={() => {}} style={{
          width: '48px', height: '48px', borderRadius: '50%',
          backgroundColor: '#f5f5f5', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ArrowClockwise size={20} color="#333333" />
        </button>
      </div>

      {/* type to me shortcut */}
      <span
        onClick={() => navigate('/chat')}
        style={{
          textAlign: 'center', fontSize: '13px', color: '#FE7F3C',
          cursor: 'pointer', fontWeight: 500, paddingBottom: '8px',
          marginBottom: '70px'
        }}>
        <- type to me
      </span>

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