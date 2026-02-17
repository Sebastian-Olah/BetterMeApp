import { useCallback } from 'react'
import { getJournalEntries, saveJournalEntries } from '../utils/storage'
import type { JournalEntry } from '../types/index'

// encapsulates all journal entry operations in one reusable hook
export function useJournal() {
  const loadEntries = useCallback((): JournalEntry[] => {
    return getJournalEntries()
  }, [])

  // returns today's entry if one exists
  const getTodayEntry = useCallback((): JournalEntry | undefined => {
    const today = new Date().toISOString().split('T')[0]
    return getJournalEntries().find(e => e.date === today)
  }, [])

  // checks if an entry has already been written today
  const hasEntryToday = useCallback((): boolean => {
    const today = new Date().toISOString().split('T')[0]
    return getJournalEntries().some(e => e.date === today)
  }, [])

  // creates a new entry and prepends it to the list
  const addEntry = useCallback((content: string, imagePath?: string) => {
    const entries = getJournalEntries()
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      content,
      imagePath,
    }
    saveJournalEntries([newEntry, ...entries])
    return newEntry
  }, [])

  // updates content and optionally the image of an existing entry
  const editEntry = useCallback((id: string, content: string, imagePath?: string) => {
    const entries = getJournalEntries()
    const updated = entries.map(e =>
      e.id === id ? { ...e, content, imagePath: imagePath ?? e.imagePath } : e
    )
    saveJournalEntries(updated)
  }, [])

  const deleteEntry = useCallback((id: string) => {
    const entries = getJournalEntries()
    saveJournalEntries(entries.filter(e => e.id !== id))
  }, [])

  return {
    loadEntries,
    getTodayEntry,
    hasEntryToday,
    addEntry,
    editEntry,
    deleteEntry,
  }
}