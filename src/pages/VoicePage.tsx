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

// tested - shared history confirmed working across both screens
// conversation is continuous regardless of which input method the user uses
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

  // scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // persist shared conversation history on every change
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  // tested on real Android device via ngrok
  // continuous false confirmed to fix mobile chrome duplication bug
  // isListeningRef confirmed to fix closure problem in onend handler
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setTranscript('voice input is not supported. please use chrome.')
      return
    }

    const recognition = new SpeechRecognition()

    // continuous false prevents mobile chrome from duplicating results
    // the api fires onresult once per utterance then fires onend
    // the onend handler restarts recognition immediately to keep it going
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      if (isSendingRef.current) return

      // only process new final results using event.resultIndex
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }

      if (finalTranscript) {
        // combine with any paused text saved before the pause
        const combined = pausedTextRef.current
          ? pausedTextRef.current + ' ' + finalTranscript
          : finalTranscript
        pausedTextRef.current = combined.trim()
        setTranscript(combined.trim())
      }
    }

    recognition.onend = () => {
      // if still supposed to be listening, restart automatically
      // uses isListeningRef not isListening state because this handler is in a closure
      // and cannot read the current value of state - it would always see the initial false
      if (isListeningRef.current && !isSendingRef.current) {
        try {
          recognition.start()
        } catch {
          setIsListening(false)
          isListeningRef.current = false
        }
      } else {
        setIsListening(false)
        isListeningRef.current = false
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  const sendTranscriptToAI = async (text: string) => {
    if (!text.trim()) return
    // isSendingRef acts as a lock - first caller sets it to true
    // any subsequent call finds it true and returns immediately
    if (isSendingRef.current) return
    isSendingRef.current = true

    clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = null
    recognitionRef.current?.stop()

    // update both state and ref together
    setIsListening(false)
    isListeningRef.current = false
    setIsPaused(false)
    setHasStarted(true)
    setTranscript('')
    pausedTextRef.current = ''

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const journalEntries = getJournalEntries()
        .slice(0, 3)
        .map(e => `${e.date}: ${e.content}`)
        .join('\n')

      const activeGoals = getGoals()
        .filter(g => g.status === 'active' || g.status === 'almost-over')
        .map(g => `- ${g.name} (${g.category}, streak: ${calculateStreak(g.id)} days)`)
        .join('\n')

      const prefs = getPreferences()

      const history = [
        { role: 'system' as const, content: buildSystemPrompt(prefs.tone, journalEntries, activeGoals) },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: text.trim() }
      ]

      const response = await sendToAI(history)

      // safety net - same as chat screen
      // handles cases where AI confirms goal creation verbally but returns action null
      const confirmationPhrases = ["i've added", "i've set", "i've created", "goal has been added", "added your goal", "set that goal"]
      const messageLower = response.message.toLowerCase()
      const saidItCreated = confirmationPhrases.some(p => messageLower.includes(p))

      if (saidItCreated && !response.action) {
        let goalName = ''
        const currentBoldMatch = response.message.match(/\*\*(.*?)\*\*/)
        if (currentBoldMatch) goalName = currentBoldMatch[1]
        if (!goalName) {
          const goalToMatch = response.message.match(/goal to (.+?)(?:\.|!|,|$)/i)
          if (goalToMatch) goalName = goalToMatch[1].trim()
        }
        if (!goalName) {
          const lastAssistantMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || ''
          const boldMatch = lastAssistantMsg.match(/\*\*(.*?)\*\*/)
          if (boldMatch) goalName = boldMatch[1]
        }
        if (goalName) {
          response.action = {
            type: 'createGoal',
            data: { name: goalName, category: 'Other', frequency: 'Daily', accountabilityLevel: 'Medium' }
          }
        }
      }

      // structured output pattern - action field triggers goal creation silently
      if (response.action?.type === 'createGoal') {
        addGoal({
          id: Date.now().toString(),
          name: response.action.data.name ?? 'new goal',
          category: response.action.data.category ?? 'Other',
          status: 'active',
          frequency: response.action.data.frequency ?? 'Daily',
          startDate: new Date().toISOString().split('T')[0],
          streak: 0,
          urgencyLevel: 'normal',
          accountabilityLevel: response.action.data.accountabilityLevel ?? 'Medium',
        })
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.message,
        timestamp: new Date()
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: "sorry, i couldn't connect right now. try again.",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
      isSendingRef.current = false
    }
  }

  const handleReset = () => {
    clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = null
    recognitionRef.current?.stop()
    setIsListening(false)
    isListeningRef.current = false
    setIsPaused(false)
    setTranscript('')
    pausedTextRef.current = ''
  }

  const handleMicPress = () => {
    if (isListening) {
      // second tap sends the transcript
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
      if (transcript.trim()) {
        sendTranscriptToAI(transcript)
      } else {
        recognitionRef.current?.stop()
        setIsListening(false)
        isListeningRef.current = false
      }
    } else {
      // first tap starts listening
      pausedTextRef.current = isPaused ? transcript : ''
      setIsListening(true)
      isListeningRef.current = true
      setIsPaused(false)
      recognitionRef.current?.start()
    }
  }

  const handlePause = () => {
    if (isPaused) {
      // resuming - restore saved text and restart recognition
      pausedTextRef.current = transcript
      setIsPaused(false)
      setIsListening(true)
      isListeningRef.current = true
      recognitionRef.current?.start()
    } else {
      // pausing - save current transcript in ref so it persists across re-renders
      setIsPaused(true)
      setIsListening(false)
      isListeningRef.current = false
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
      recognitionRef.current?.stop()
    }
  }

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
              onClick={handleMicPress}
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
              {isListening ? 'listening... tap mic to send' :
                isPaused ? 'paused - tap play to continue' :
                  'tap the circle to start speaking'}
            </p>
            {transcript ? (
              <p style={{
                fontSize: '15px', color: '#333333', lineHeight: '1.6',
                fontStyle: 'italic', textAlign: 'center', padding: '0 16px'
              }}>
                "{transcript}"
              </p>
            ) : null}
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
        <button onClick={handlePause} style={{
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
        <button onClick={handleMicPress} style={{
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

        <button onClick={handleReset} style={{
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
        {'<- type to me'}
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