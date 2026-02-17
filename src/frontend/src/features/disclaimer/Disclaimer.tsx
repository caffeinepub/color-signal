import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Important Disclaimer</p>
          <p className="text-sm text-muted-foreground">
            This application provides heuristic predictions based on pattern analysis of your input
            history. Predictions are for informational and educational purposes only and are not
            guaranteed to be accurate. Do not rely on these predictions for financial decisions or
            trading activities. Past patterns do not guarantee future results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
