import { useRef, useState, useCallback } from 'react';
import type { BigSmallResult } from './historyTypes';

interface GatedHistoryFlowState {
  isUnlockedForNextEntry: boolean;
  handleNext: () => void;
  handleAddEntry: (result: BigSmallResult, addToHistory: (result: BigSmallResult) => void) => void;
  resetGate: () => void;
}

/**
 * Hook that manages the 20/20 gated flow state machine:
 * - Locked at 20/20 (Big/Small disabled)
 * - Unlock exactly one add after "Next" is pressed
 * - Immediately re-lock after that single add
 * Uses a ref-backed token to prevent double-tap acceptance before React state updates
 */
export function useGatedHistoryFlow(historyCount: number): GatedHistoryFlowState {
  const [isUnlockedForNextEntry, setIsUnlockedForNextEntry] = useState(false);
  const unlockTokenRef = useRef(0);

  // Reset gate when history drops below 20
  if (historyCount < 20 && isUnlockedForNextEntry) {
    setIsUnlockedForNextEntry(false);
    unlockTokenRef.current = 0;
  }

  const handleNext = useCallback(() => {
    if (historyCount === 20) {
      setIsUnlockedForNextEntry(true);
      unlockTokenRef.current = 1; // Grant exactly one token
    }
  }, [historyCount]);

  const handleAddEntry = useCallback(
    (result: BigSmallResult, addToHistory: (result: BigSmallResult) => void) => {
      // If history is not full, allow adding freely
      if (historyCount < 20) {
        addToHistory(result);
        return;
      }

      // If history is full (20 items), only allow if we have a token
      if (historyCount === 20 && unlockTokenRef.current > 0) {
        // Consume the token immediately (synchronous guard)
        unlockTokenRef.current = 0;
        addToHistory(result);
        // Lock again after this single tap
        setIsUnlockedForNextEntry(false);
      }
      // Otherwise, do nothing (buttons should be disabled)
    },
    [historyCount]
  );

  const resetGate = useCallback(() => {
    setIsUnlockedForNextEntry(false);
    unlockTokenRef.current = 0;
  }, []);

  return {
    isUnlockedForNextEntry,
    handleNext,
    handleAddEntry,
    resetGate,
  };
}
