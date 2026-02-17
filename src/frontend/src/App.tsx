import { Card } from '@/components/ui/card';
import HistoryControls from './features/history/HistoryControls';
import ResultsPanel from './features/results/ResultsPanel';
import PredictionPanel from './features/prediction/PredictionPanel';
import Disclaimer from './features/disclaimer/Disclaimer';
import { useLocalHistory } from './features/history/useLocalHistory';
import { usePrediction } from './features/prediction/usePrediction';
import { useActorConnection } from './features/prediction/useActorConnection';
import { useGatedHistoryFlow } from './features/history/useGatedHistoryFlow';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { TrendingUp } from 'lucide-react';
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
  } = usePrediction(history);

  const { isReady, isConnecting, retry: retryConnection } = useActorConnection();

  // Wrapped addEntry handler that uses the gated flow
  const handleAddEntry = (result: BigSmallResult) => {
    gatedAddEntry(result, addEntryToHistory);
  };

  // Wrapped clear handler that also resets the gate state
  const handleClearHistory = () => {
    clearHistoryState();
    resetGate();
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
              onPredict={generatePrediction}
              onNext={handleNext}
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
