import { useCallback, useState, useEffect } from 'react';
import { usePredictNext, useUpdatePredictionFeedback } from '../../hooks/useQueries';
import { useActor } from '../../hooks/useActor';
import type { HistoryItem } from '../../backend';

export interface PredictionError {
  category: 'backend_unavailable' | 'network_error' | 'unexpected_error';
  message: string;
}

export function usePrediction(history: HistoryItem[], feedbackArray?: boolean[]) {
  const { actor, isFetching: actorFetching } = useActor();
  const { mutateAsync: predictNext, isPending } = usePredictNext();
  const { mutateAsync: updateFeedback } = useUpdatePredictionFeedback();
  const [prediction, setPrediction] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<PredictionError | null>(null);

  const isActorReady = !!actor && !actorFetching;

  // Reset prediction when history becomes empty
  useEffect(() => {
    if (history.length === 0 && prediction) {
      setPrediction('');
      setExplanation('');
      setLastGeneratedAt(null);
      setError(null);
    }
  }, [history.length, prediction]);

  // Clear error state when actor becomes ready
  useEffect(() => {
    if (isActorReady && error?.category === 'backend_unavailable') {
      setError(null);
    }
  }, [isActorReady, error?.category]);

  const categorizeError = (err: any): PredictionError => {
    const errorMessage = err?.message || String(err);
    
    if (errorMessage.includes('Actor not available') || errorMessage.includes('actor')) {
      return {
        category: 'backend_unavailable',
        message: 'Backend service is not available. Please wait a moment and try again.',
      };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
      return {
        category: 'network_error',
        message: 'Network connection issue. Please check your connection and retry.',
      };
    }
    
    return {
      category: 'unexpected_error',
      message: 'An unexpected error occurred. Please try again.',
    };
  };

  const generatePrediction = useCallback(async () => {
    if (history.length === 0) {
      return;
    }

    if (!isActorReady) {
      setError({
        category: 'backend_unavailable',
        message: 'Backend is still initializing. Please wait a moment.',
      });
      return;
    }

    try {
      setError(null);
      
      // Send feedback before generating prediction if available
      if (feedbackArray && feedbackArray.length > 0) {
        await updateFeedback(feedbackArray);
      }
      
      const result = await predictNext(history);
      setPrediction(result.prediction);
      setExplanation(result.explanation);
      setLastGeneratedAt(new Date());
    } catch (err: any) {
      console.error('Prediction error:', err);
      const categorizedError = categorizeError(err);
      setError(categorizedError);
    }
  }, [history, predictNext, updateFeedback, feedbackArray, isActorReady]);

  // Dedicated retry function that always uses current in-memory history
  const retryPrediction = useCallback(async () => {
    if (history.length === 0) {
      return;
    }

    if (!isActorReady) {
      setError({
        category: 'backend_unavailable',
        message: 'Backend is still initializing. Please wait a moment.',
      });
      return;
    }

    try {
      setError(null);
      
      // Send feedback before retrying prediction if available
      if (feedbackArray && feedbackArray.length > 0) {
        await updateFeedback(feedbackArray);
      }
      
      const result = await predictNext(history);
      setPrediction(result.prediction);
      setExplanation(result.explanation);
      setLastGeneratedAt(new Date());
    } catch (err: any) {
      console.error('Prediction retry error:', err);
      const categorizedError = categorizeError(err);
      setError(categorizedError);
    }
  }, [history, predictNext, updateFeedback, feedbackArray, isActorReady]);

  return {
    prediction,
    explanation,
    isLoadingPrediction: isPending,
    lastGeneratedAt,
    error,
    hasError: !!error,
    isInitializing: !isActorReady && history.length > 0,
    generatePrediction,
    retryPrediction,
  };
}
