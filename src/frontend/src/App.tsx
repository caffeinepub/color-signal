import { useState } from 'react';
import { Card } from '@/components/ui/card';
import HistoryControls from './features/history/HistoryControls';
import ResultsPanel from './features/results/ResultsPanel';
import PredictionPanel from './features/prediction/PredictionPanel';
import Disclaimer from './features/disclaimer/Disclaimer';
import { useLocalHistory } from './features/history/useLocalHistory';
import { usePrediction } from './features/prediction/usePrediction';
import { useActorConnection } from './features/prediction/useActorConnection';
import { useGatedHistoryFlow } from './features/history/useGatedHistoryFlow';
import { usePredictionFeedback } from './features/prediction/usePredictionFeedback';
import { useUploadHistoricalPatterns } from './hooks/useQueries';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import type { BigSmallResult } from './features/history/historyTypes';

function AppContent() {
  const {
    history,
    addEntry: addEntryToHistory,
    removeLastEntry,
    clearHistory: clearHistoryState,
  } = useLocalHistory();

  const historyCount = history.length;

  // Use the gated history flow hook as single source of truth
  const { isUnlockedForNextEntry, handleNext, handleAddEntry: gatedAddEntry, resetGate } = useGatedHistoryFlow(historyCount);

  // Feedback management
  const { feedbackHistory, addFeedback, clearFeedback, getFeedbackArray } = usePredictionFeedback();
  const [feedbackRecordedForCurrentPrediction, setFeedbackRecordedForCurrentPrediction] = useState(false);

  const { 
    prediction, 
    explanation, 
    isLoadingPrediction, 
    lastGeneratedAt, 
    error,
    hasError,
    isInitializing,
    generatePrediction,
    retryPrediction,
  } = usePrediction(history, getFeedbackArray());

  const { isReady, isConnecting, retry: retryConnection } = useActorConnection();

  const { mutateAsync: uploadPatterns } = useUploadHistoricalPatterns();

  // Wrapped addEntry handler that uses the gated flow
  const handleAddEntry = (result: BigSmallResult) => {
    gatedAddEntry(result, addEntryToHistory);
  };

  // Wrapped clear handler that also resets the gate state and feedback
  const handleClearHistory = () => {
    clearHistoryState();
    resetGate();
    clearFeedback();
    setFeedbackRecordedForCurrentPrediction(false);
  };

  // Handle feedback recording
  const handleFeedback = (isWin: boolean) => {
    if (lastGeneratedAt && !feedbackRecordedForCurrentPrediction) {
      addFeedback(lastGeneratedAt.getTime(), isWin);
      setFeedbackRecordedForCurrentPrediction(true);
      toast.success(isWin ? 'Win recorded!' : 'Loss recorded!');
    }
  };

  // Wrapped prediction handler that resets feedback state
  const handleGeneratePrediction = async () => {
    setFeedbackRecordedForCurrentPrediction(false);
    await generatePrediction();
  };

  // Handle pattern upload
  const handleUploadPatterns = async (patterns: string[][]) => {
    await uploadPatterns(patterns);
  };

  const connectionHint = isConnecting 
    ? 'Connecting to backend system. Prediction will be available shortly.'
    : undefined;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Color Signal</h1>
              <p className="text-sm text-muted-foreground">Big/Small Prediction Dashboard</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Controls Section */}
          <section>
            <HistoryControls
              onAddEntry={handleAddEntry}
              onClearHistory={handleClearHistory}
              onPredict={handleGeneratePrediction}
              onNext={handleNext}
              onUploadPatterns={handleUploadPatterns}
              historyCount={historyCount}
              isPredicting={isLoadingPrediction}
              isInitializing={isInitializing}
              isUnlockedForNextEntry={isUnlockedForNextEntry}
              isConnecting={isConnecting}
              connectionHint={connectionHint}
            />
          </section>

          {/* Results Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <ResultsPanel
                history={history}
                prediction={prediction}
                lastGeneratedAt={lastGeneratedAt}
              />
            </section>

            <section>
              <PredictionPanel
                prediction={prediction}
                explanation={explanation}
                isLoading={isLoadingPrediction}
                historyCount={history.length}
                error={error}
                isInitializing={isInitializing}
                isConnecting={isConnecting}
                onRetryPrediction={retryPrediction}
                onRetryConnection={retryConnection}
                onFeedback={handleFeedback}
                feedbackRecorded={feedbackRecordedForCurrentPrediction}
              />
            </section>
          </div>

          {/* Disclaimer */}
          <section>
            <Disclaimer />
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Color Signal. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}
