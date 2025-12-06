import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TutorialTooltipProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Custom tooltip component for Driver.js
 * Uses semantic Tailwind colors and 44px touch targets
 */
export function TutorialTooltip({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
  isFirst,
  isLast,
}: TutorialTooltipProps) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-lg p-4 max-w-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg leading-tight">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 -mr-2 -mt-1"
          aria-label="Close tutorial"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {description}
      </p>

      {/* Progress indicator */}
      <div className="flex items-center gap-1 mt-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
            style={{ width: `${100 / totalSteps}%` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Step {currentStep + 1} of {totalSteps}
      </p>

      {/* Navigation buttons - 44px touch targets */}
      <div className="flex justify-between mt-4 gap-2">
        <Button
          variant="ghost"
          size="default"
          onClick={isFirst ? onClose : onPrevious}
          className="h-11 px-4"
        >
          {isFirst ? 'Skip' : '← Back'}
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={onNext}
          className="h-11 px-6"
        >
          {isLast ? 'Finish' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
