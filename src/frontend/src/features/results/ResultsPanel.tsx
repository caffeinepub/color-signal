import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, History } from 'lucide-react';
import type { HistoryItem } from '../../backend';

interface ResultsPanelProps {
  history: HistoryItem[];
  prediction: string;
  lastGeneratedAt: Date | null;
}

export default function ResultsPanel({ history, prediction, lastGeneratedAt }: ResultsPanelProps) {
  const formatPredictionTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Split history into three rows: items 1-10, items 11-20, and items 21-30
  const firstRow = history.slice(0, 10);
  const secondRow = history.slice(10, 20);
  const thirdRow = history.slice(20, 30);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Results Dashboard
        </CardTitle>
        <CardDescription>Your running history and latest prediction</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Latest Prediction */}
        {prediction && lastGeneratedAt && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Latest Prediction</label>
            <div className="rounded-lg border border-chart-2 bg-chart-2/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="border-chart-2 bg-chart-2/20 px-4 py-1.5 text-lg font-bold text-chart-2"
                  >
                    {prediction}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">Predicted Signal</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatPredictionTime(lastGeneratedAt)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Three-Line History */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            History ({history.length}/30)
          </label>
          {history.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
              <p className="text-sm text-muted-foreground">No entries yet. Add your first result above.</p>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
              {/* First Row: Items 1-10 */}
              <div className="flex flex-wrap items-center gap-2">
                {firstRow.map((item, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium ${
                      item.result === 'Big'
                        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                        : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {index + 1}. {item.result}
                  </span>
                ))}
              </div>

              {/* Second Row: Items 11-20 */}
              {secondRow.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {secondRow.map((item, index) => (
                    <span
                      key={index + 10}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium ${
                        item.result === 'Big'
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {index + 11}. {item.result}
                    </span>
                  ))}
                </div>
              )}

              {/* Third Row: Items 21-30 */}
              {thirdRow.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {thirdRow.map((item, index) => (
                    <span
                      key={index + 20}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium ${
                        item.result === 'Big'
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {index + 21}. {item.result}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
