import { useState, useCallback } from 'react';

export interface PredictionFeedback {
  timestamp: number;
  isWin: boolean;
}

export function usePredictionFeedback() {
  const [feedbackHistory, setFeedbackHistory] = useState<PredictionFeedback[]>([]);

  const addFeedback = useCallback((timestamp: number, isWin: boolean) => {
    setFeedbackHistory((prev) => [...prev, { timestamp, isWin }]);
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedbackHistory([]);
  }, []);

  const getFeedbackArray = useCallback((): boolean[] => {
    return feedbackHistory.map((f) => f.isWin);
  }, [feedbackHistory]);

  return {
    feedbackHistory,
    addFeedback,
    clearFeedback,
    getFeedbackArray,
  };
}
