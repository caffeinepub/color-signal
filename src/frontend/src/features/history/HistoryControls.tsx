import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Sparkles, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import type { BigSmallResult } from './historyTypes';

interface HistoryControlsProps {
  onAddEntry: (result: BigSmallResult) => void;
  onClearHistory: () => void;
  onPredict: () => void;
  onNext: () => void;
  historyCount: number;
  isPredicting: boolean;
  isInitializing: boolean;
  isUnlockedForNextEntry: boolean;
  isConnecting?: boolean;
  connectionHint?: string;
}

export default function HistoryControls({
  onAddEntry,
  onClearHistory,
  onPredict,
  onNext,
  historyCount,
  isPredicting,
  isInitializing,
  isUnlockedForNextEntry,
  isConnecting = false,
  connectionHint,
}: HistoryControlsProps) {
  const isHistoryFull = historyCount === 20;
  
  // Big/Small buttons are disabled when history is full AND not unlocked
  const areBigSmallButtonsDisabled = isHistoryFull && !isUnlockedForNextEntry;

  const handleBigTap = () => {
    if (!areBigSmallButtonsDisabled) {
      onAddEntry('Big');
    }
  };

  const handleSmallTap = () => {
    if (!areBigSmallButtonsDisabled) {
      onAddEntry('Small');
    }
  };

  const isPredictDisabled = historyCount === 0 || isPredicting || isInitializing || isConnecting;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Add Results</CardTitle>
            <CardDescription>
              {isHistoryFull && !isUnlockedForNextEntry
                ? 'Press Next to add another entry'
                : 'Tap to add Big or Small results'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg font-semibold">
            {historyCount}/20
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection hint */}
        {isConnecting && connectionHint && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{connectionHint}</p>
          </div>
        )}

        {/* Tap-to-Add Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            onClick={handleBigTap}
            disabled={areBigSmallButtonsDisabled}
            data-testid="big-button"
            className="h-24 text-2xl font-bold bg-yellow-500 hover:bg-yellow-600 text-black border-0 disabled:opacity-50"
          >
            Big
          </Button>
          <Button
            type="button"
            onClick={handleSmallTap}
            disabled={areBigSmallButtonsDisabled}
            data-testid="small-button"
            className="h-24 text-2xl font-bold bg-blue-500 hover:bg-blue-600 text-white border-0 disabled:opacity-50"
          >
            Small
          </Button>
        </div>

        {/* Next Button - shown whenever history count is exactly 20 */}
        {historyCount === 20 && (
          <Button
            onClick={onNext}
            variant="secondary"
            data-testid="next-button"
            className="h-14 w-full text-lg font-semibold"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Next
          </Button>
        )}

        {/* Prediction Button */}
        <Button
          onClick={onPredict}
          disabled={isPredictDisabled}
          variant="default"
          data-testid="prediction-button"
          className="h-14 w-full text-lg font-semibold"
        >
          {isPredicting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Predicting...
            </>
          ) : isInitializing || isConnecting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Prediction
            </>
          )}
        </Button>

        {/* Clear All Button */}
        <Button
          onClick={onClearHistory}
          disabled={historyCount === 0}
          variant="outline"
          className="w-full"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </CardContent>
    </Card>
  );
}
