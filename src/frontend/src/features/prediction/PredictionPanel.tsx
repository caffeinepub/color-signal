import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, AlertTriangle, XCircle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react';
import type { PredictionError } from './usePrediction';

interface PredictionPanelProps {
  prediction: string;
  explanation: string;
  isLoading: boolean;
  historyCount: number;
  error: PredictionError | null;
  isInitializing: boolean;
  onRetryPrediction?: () => void;
  onRetryConnection?: () => void;
  isConnecting?: boolean;
}

export default function PredictionPanel({
  prediction,
  explanation,
  isLoading,
  historyCount,
  error,
  isInitializing,
  onRetryPrediction,
  onRetryConnection,
  isConnecting = false,
}: PredictionPanelProps) {
  const getErrorIcon = () => {
    if (!error) return <XCircle className="h-12 w-12 text-destructive" />;
    
    switch (error.category) {
      case 'backend_unavailable':
        return <ServerCrash className="h-12 w-12 text-destructive" />;
      case 'network_error':
        return <WifiOff className="h-12 w-12 text-destructive" />;
      default:
        return <XCircle className="h-12 w-12 text-destructive" />;
    }
  };

  const getErrorTitle = () => {
    if (!error) return 'Prediction Failed';
    
    switch (error.category) {
      case 'backend_unavailable':
        return 'Backend Unavailable';
      case 'network_error':
        return 'Network Error';
      default:
        return 'Unexpected Error';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Prediction Analysis
        </CardTitle>
        <CardDescription>AI-powered signal based on your history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {historyCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <AlertTriangle className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No History Available</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add at least 1 entry to generate a prediction
            </p>
          </div>
        ) : isInitializing || isConnecting ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border py-12 space-y-4" data-testid="prediction-connecting">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">Connecting to backend...</p>
              <p className="text-xs text-muted-foreground">
                Please wait while the system initializes
              </p>
            </div>
            {onRetryConnection && (
              <Button
                onClick={onRetryConnection}
                variant="outline"
                size="sm"
                className="mt-2"
                data-testid="retry-connection-button"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border py-12" data-testid="prediction-loading">
            <Loader2 className="mb-3 h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analyzing patterns...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 py-12 text-center space-y-4" data-testid="prediction-error">
            {getErrorIcon()}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground" data-testid="error-title">{getErrorTitle()}</p>
              <p className="text-xs text-muted-foreground max-w-sm" data-testid="error-message">
                {error.message}
              </p>
            </div>
            <div className="flex gap-2">
              {onRetryPrediction && (
                <Button
                  onClick={onRetryPrediction}
                  variant="outline"
                  size="sm"
                  data-testid="retry-prediction-button"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Prediction
                </Button>
              )}
              {error.category === 'backend_unavailable' && onRetryConnection && (
                <Button
                  onClick={onRetryConnection}
                  variant="outline"
                  size="sm"
                  data-testid="retry-connection-button"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
              )}
            </div>
          </div>
        ) : prediction ? (
          <div data-testid="prediction-result">
            {/* Prediction Signal */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Next Signal</label>
              <div className="flex items-center justify-center rounded-lg border-2 border-chart-1 bg-chart-1/10 py-8">
                <Badge
                  variant="outline"
                  className="border-chart-1 bg-chart-1/20 px-8 py-3 text-3xl font-bold text-chart-1"
                  data-testid="prediction-value"
                >
                  {prediction}
                </Badge>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-3 mt-6">
              <label className="text-sm font-medium text-muted-foreground">Analysis</label>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm leading-relaxed text-foreground" data-testid="prediction-explanation">{explanation}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <AlertTriangle className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No Prediction Yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click the Prediction button to generate
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
