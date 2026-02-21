import { useState, useCallback } from 'react';
import type { BigSmallResult } from './historyTypes';
import type { HistoryItem } from '../../backend';

const MAX_HISTORY_SIZE = 20;

export function useLocalHistory() {
  const [history, setHistoryState] = useState<HistoryItem[]>([]);

  const addEntry = useCallback((result: BigSmallResult) => {
    setHistoryState((prev) => {
      const newEntry: HistoryItem = {
        result,
        timestamp: BigInt(Date.now()),
      };
      const updated = [...prev, newEntry];
      // Keep only the last 20 entries (rolling window)
      if (updated.length > MAX_HISTORY_SIZE) {
        return updated.slice(-MAX_HISTORY_SIZE);
      }
      return updated;
    });
  }, []);

  const removeLastEntry = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistoryState([]);
  }, []);

  const setHistory = useCallback((newHistory: HistoryItem[]) => {
    setHistoryState(newHistory.slice(-MAX_HISTORY_SIZE));
  }, []);

  return {
    history,
    addEntry,
    removeLastEntry,
    clearHistory,
    setHistory,
  };
}
