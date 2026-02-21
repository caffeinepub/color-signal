import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (patterns: string[][]) => Promise<void>;
}

export default function HistoryUploadDialog({
  open,
  onOpenChange,
  onUpload,
}: HistoryUploadDialogProps) {
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Please enter pattern data');
      return;
    }

    // Parse input - accept comma or newline separated values
    const lines = input
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Validate that all entries are either "Big" or "Small"
    const invalidEntries = lines.filter(
      (entry) => entry !== 'Big' && entry !== 'Small'
    );

    if (invalidEntries.length > 0) {
      toast.error(
        `Invalid entries found: ${invalidEntries.slice(0, 3).join(', ')}${
          invalidEntries.length > 3 ? '...' : ''
        }. Only "Big" or "Small" are allowed.`
      );
      return;
    }

    // Group into patterns of 3 (or whatever makes sense for pattern analysis)
    const patterns: string[][] = [];
    const patternLength = 3;

    for (let i = 0; i <= lines.length - patternLength; i++) {
      patterns.push(lines.slice(i, i + patternLength));
    }

    if (patterns.length === 0) {
      toast.error('Not enough data to create patterns. Please enter at least 3 entries.');
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(patterns);
      toast.success(`Successfully uploaded ${patterns.length} patterns`);
      setInput('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload patterns');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Historical Patterns</DialogTitle>
          <DialogDescription>
            Enter historical Big/Small results to improve prediction accuracy. Separate entries with commas or new lines.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pattern-input">Pattern Data</Label>
            <Textarea
              id="pattern-input"
              placeholder="Big, Small, Big, Big, Small, Small..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Example: Big, Small, Big, Big, Small, Small, Big
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
