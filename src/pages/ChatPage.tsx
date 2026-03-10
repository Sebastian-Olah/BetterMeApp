import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { House, Target, ChatCircle, Notebook, Gear, Microphone, PaperPlaneTilt } from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
import { sendMessage as sendToAI, buildSystemPrompt } from '../services/openai'
import { getJournalEntries, getPreferences, getGoals } from '../utils/storage'
import { calculateStreak } from '../utils/streak'

// message type used for the chat history array
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// shared storage key used by both chat and voice screens
const CHAT_STORAGE_KEY = 'better_me_chat'

// initial greeting shown when no history exists yet
const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "hi! how can i help you today?",
    timestamp: new Date()
  }
]

export default function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  

  // restores conversation history from localStorage on mount
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    return stored ? JSON.parse(stored) : initialMessages
  })

  // scrolls to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // persists conversation history to localStorage on every change
 //  same key is being used by voice screen so history is shared across both input methods
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
  
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
  
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
  
    try {
      // read journal entries and goals to inject into system prompt as context
     // this makes the AI aware of what the user has been working on before the conversation starts
      const journalEntries = getJournalEntries()
        .slice(0, 3)
        .map(e => `${e.date}: ${e.content}`)
        .join('\n')
  
      const activeGoals = getGoals()
        .filter(g => g.status === 'active' || g.status === 'almost-over')
        .map(g => `- ${g.name} (${g.category}, streak: ${calculateStreak(g.id)} days)`)
        .join('\n')
  
      const prefs = getPreferences()
  
      // build full conversation history with system prompt prepended
      const history = [
        { role: 'system' as const, content: buildSystemPrompt(prefs.tone, journalEntries, activeGoals) },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: input.trim() }
      ]
  
      const aiResponse = await sendToAI(history)
  
      // safety net - LLMs are not perfectly reliable at following JSON format instructions
     // if the AI says it created a goal but returns action null, extract the goals name from the message
      const confirmationPhrases = ["i've added", "i've set", "i've created", "goal has been added", "added your goal", "set that goal"]
      const messageLower = aiResponse.message.toLowerCase()
      const saidItCreated = confirmationPhrases.some(p => messageLower.includes(p))
  
      if (saidItCreated && !aiResponse.action) {
        let goalName = ''
  
        // try to extract goal name from bold markdown first
        const currentBoldMatch = aiResponse.message.match(/\*\*(.*?)\*\*/)
        if (currentBoldMatch) goalName = currentBoldMatch[1]
  
        // fall back to "goal to X" pattern
        if (!goalName) {
          const goalToMatch = aiResponse.message.match(/goal to (.+?)(?:\.|!|,|$)/i)
          if (goalToMatch) goalName = goalToMatch[1].trim()
        }
  
        // fall back to previous assistant message bold text
        if (!goalName) {
          const lastAssistantMsg = messages
            .filter(m => m.role === 'assistant')
            .slice(-1)[0]?.content || ''
          const boldMatch = lastAssistantMsg.match(/\*\*(.*?)\*\*/)
          if (boldMatch) goalName = boldMatch[1]
        }
  
        if (goalName) {
          aiResponse.action = {
            type: 'createGoal',
            data: {
              name: goalName,
              category: 'Other',
              frequency: 'Daily',
              accountabilityLevel: 'Medium'
            }
          }
        }
      }
  
      // structured output pattern - the AI returns both a message and an optional action
     // the action field triggers real app changes silently without the user seeing any JSON

      if (aiResponse.action?.type === 'createGoal') {
        const { addGoal } = await import('../utils/storage')
        addGoal({
          id: Date.now().toString(),
          name: aiResponse.action.data.name ?? 'new goal',
          category: aiResponse.action.data.category ?? 'Other',
          status: 'active',
          frequency: aiResponse.action.data.frequency ?? 'Daily',
          startDate: new Date().toISOString().split('T')[0],
          streak: 0,
          urgencyLevel: 'normal',
          accountabilityLevel: aiResponse.action.data.accountabilityLevel ?? 'Medium',
        })
      }
  
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: aiResponse.message,
        timestamp: new Date()
      }])
    } catch {
      // show fallback message if API call fails
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: "sorry, i couldn't connect right now. try again.",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // ai integration added in later commit
    // placeholder response for now
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "i'm getting set up - ai integration coming soon!",
        timestamp: new Date()
      }])
      setIsLoading(false)
    }, 1000)
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
            Smart Chat
          </h1>
          <p style={{ fontSize: '12px', color: '#999999' }}>your personal AI coach</p>
        </div>
      </div>

      {/* scrollable messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
            {/* user messages right aligned orange, assistant messages left aligned grey */}
            <div style={{
              maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
              borderBottomLeftRadius: message.role === 'assistant' ? '4px' : '16px',
              borderBottomRightRadius: message.role === 'user' ? '4px' : '16px',
              backgroundColor: message.role === 'user' ? '#FE7F3C' : '#f5f5f5',
              color: message.role === 'user' ? 'white' : '#333333',
              fontSize: '14px', lineHeight: '1.5'
            }}>
              {/* react-markdown renders bold and bullet points from AI responses */}
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {/* loading dots shown while waiting for AI response */}
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

        {/* invisible div at bottom used as scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* voice shortcut link */}
      <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
        <span
          onClick={() => navigate('/voice')}
          style={{ fontSize: '13px', color: '#FE7F3C', cursor: 'pointer', fontWeight: 500 }}>
          talk to me ->
        </span>
      </div>

      {/* input bar with dynamic send/mic icon */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '70px'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="type a message..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '999px',
            border: '1px solid #f0f0f0', fontSize: '14px', outline: 'none',
            backgroundColor: '#fafafa', color: '#333333'
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            backgroundColor: '#FE7F3C', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
          {/* icon switches between mic and send depending on whether input has text */}
          {input.trim() ? (
            <PaperPlaneTilt size={18} color="white" weight="fill" />
          ) : (
            <Microphone size={18} color="white" weight="fill" />
          )}
        </button>
      </div>

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