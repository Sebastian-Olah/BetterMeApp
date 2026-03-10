import { useCallback } from 'react'
import { sendMessage, buildSystemPrompt } from '../services/openai'
import { getJournalEntries, getGoals, getPreferences } from '../utils/storage'
import { calculateStreak } from '../utils/streak'
import type { OpenAIChatMessage } from '../services/openai'

// encapsulates AI context building and message sending
export function useAI() {
  // reads journal and goals from localStorage and formats them for the system prompt
  const buildContext = useCallback(() => {
    const journalEntries = getJournalEntries()
      .slice(0, 3)
      .map(e => `${e.date}: ${e.content}`)
      .join('\n')

    const activeGoals = getGoals()
      .filter(g => g.status === 'active' || g.status === 'almost-over')
      .map(g => `- ${g.name} (${g.category}, streak: ${calculateStreak(g.id)} days)`)
      .join('\n')

    return { journalEntries, activeGoals }
  }, [])

  // sends a message to the AI with the full conversation history and context
  const sendAIMessage = useCallback(async (
    userMessage: string,
    conversationHistory: OpenAIChatMessage[]
  ) => {
    const prefs = getPreferences()
    const { journalEntries, activeGoals } = buildContext()

    const messages: OpenAIChatMessage[] = [
      {
        role: 'system',
        content: buildSystemPrompt(prefs.tone, journalEntries, activeGoals)
      },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ]

    return await sendMessage(messages)
  }, [buildContext])

  return {
    sendAIMessage,
    buildContext,
  }
}